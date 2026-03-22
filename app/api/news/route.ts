export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { setCachedArticles } from "@/lib/article-cache";

let cachedArticles: any[] = [];
let lastFetched = 0;
const CACHE_MS = 2 * 60 * 60 * 1000; // 2 hours

function deduplicateArticles(articles: any[]): any[] {
  const seenTitles = new Set<string>();
  const seenDeals = new Set<string>();
  return articles.filter(article => {
    const titleKey = article.title?.toLowerCase().split(' ').slice(0, 6).join('-') ?? '';
    const dealKey = `${article.acquirer?.toLowerCase()}-${article.target?.toLowerCase()}`;
    if (seenTitles.has(titleKey) || seenDeals.has(dealKey)) return false;
    seenTitles.add(titleKey);
    if (article.acquirer && article.target) seenDeals.add(dealKey);
    return true;
  });
}

function parseRaw(raw: string): any[] {
  try {
    let s = raw.trim().replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
    const a = s.indexOf("["), b = s.lastIndexOf("]");
    if (a === -1 || b === -1) return [];
    const parsed = JSON.parse(s.substring(a, b + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export async function GET() {
  const now = Date.now();

  if (cachedArticles.length > 0 && now - lastFetched < CACHE_MS) {
    return NextResponse.json({ articles: cachedArticles, fromCache: true });
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json({ error: "GROQ_API_KEY not set", articles: [] }, { status: 500 });
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const today = new Date().toISOString().split('T')[0];

    const SYSTEM = `You are an M&A news journalist. Generate realistic, current M&A news articles.
Return ONLY a valid JSON array. No markdown. No backticks. Just raw JSON starting with [.`;

    // Three parallel calls of 25 articles each — smaller batches = more reliable JSON
    const [r1, r2, r3] = await Promise.allSettled([
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Generate exactly 25 M&A deal articles from the last 14 days. Today is ${today}.
Mix: 15 Technology (AI/software/cloud/cyber/SaaS/semiconductors), 10 Healthcare (pharma/biotech/medtech/life sciences).
RULES: PENDING or ANNOUNCED only (not closed). Unique companies. Deal values $200M-$50B. Short 1-sentence descriptions.
JSON array only: [{"title":"...","description":"One sentence.","url":"https://bm.example/t${now}-1","publishedAt":"${today}T09:00:00Z","source":{"name":"Bloomberg"},"sector":"Technology","dealValue":"$3.2B","acquirer":"Acme Corp","target":"Beta Inc"}]` },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Generate exactly 25 M&A deal articles from the last 14 days. Today is ${today}.
Mix: 12 Financials (banking/insurance/fintech/asset mgmt/payments), 13 Private Equity (LBO/buyout/take-private/growth equity).
RULES: PENDING or ANNOUNCED only (not closed). Unique companies. Deal values $200M-$50B. Short 1-sentence descriptions.
JSON array only: [{"title":"...","description":"One sentence.","url":"https://bm.example/f${now}-1","publishedAt":"${today}T09:00:00Z","source":{"name":"Reuters"},"sector":"Financials","dealValue":"$2.1B","acquirer":"Delta Ltd","target":"Gamma SA"}]` },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
      groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Generate exactly 25 M&A deal articles from the last 14 days. Today is ${today}.
Mix: 13 Energy (oil/gas/renewables/LNG/solar/wind/mining/nuclear), 12 Industrials (manufacturing/aerospace/defense/logistics/chemicals/construction).
RULES: PENDING or ANNOUNCED only (not closed). Unique companies. Deal values $200M-$50B. Short 1-sentence descriptions.
JSON array only: [{"title":"...","description":"One sentence.","url":"https://bm.example/e${now}-1","publishedAt":"${today}T09:00:00Z","source":{"name":"WSJ"},"sector":"Energy","dealValue":"$4.5B","acquirer":"Zeta Energy","target":"Omega Resources"}]` },
        ],
        temperature: 0.7,
        max_tokens: 6000,
      }),
    ]);

    const batch1 = r1.status === "fulfilled" ? parseRaw(r1.value.choices[0]?.message?.content ?? "") : [];
    const batch2 = r2.status === "fulfilled" ? parseRaw(r2.value.choices[0]?.message?.content ?? "") : [];
    const batch3 = r3.status === "fulfilled" ? parseRaw(r3.value.choices[0]?.message?.content ?? "") : [];
    if (r1.status === "rejected") console.error("[news] batch1 failed:", r1.reason);
    if (r2.status === "rejected") console.error("[news] batch2 failed:", r2.reason);
    if (r3.status === "rejected") console.error("[news] batch3 failed:", r3.reason);

    let articles = deduplicateArticles([...batch1, ...batch2, ...batch3]);

    if (articles.length < 45) {
      const fallback = getFallbackArticles();
      const seen = new Set(articles.map((a: any) => a.url));
      for (const fa of fallback) {
        if (!seen.has(fa.url)) { articles.push(fa); seen.add(fa.url); }
      }
    }

    cachedArticles = articles;
    lastFetched = now;
    setCachedArticles(articles);
    console.log(`[news] Generated ${articles.length} articles (b1:${batch1.length} b2:${batch2.length} b3:${batch3.length})`);

    return NextResponse.json(
      { articles, fromCache: false },
      { headers: { "Cache-Control": "public, s-maxage=7200, stale-while-revalidate=300" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[news] Groq failed:", msg);
    const fallback = getFallbackArticles();
    return NextResponse.json({ articles: fallback, fromCache: false, fallback: true });
  }
}

function getFallbackArticles() {
  const now = new Date().toISOString();
  return [
    // Technology (15)
    { title: "Microsoft in Advanced Talks to Acquire Cybersecurity Firm for $8.5B", description: "Microsoft is pursuing one of the largest cybersecurity acquisitions of 2026 to bolster its enterprise security stack.", url: "https://example.com/fb-msft-cyber", publishedAt: now, source: { name: "Bloomberg" }, sector: "Technology", dealValue: "$8.5B", acquirer: "Microsoft", target: "CyberSec Corp" },
    { title: "Salesforce Agrees $6.1B Deal to Acquire AI Startup DataMind", description: "Salesforce is acquiring AI startup DataMind to embed predictive analytics across its CRM platform.", url: "https://example.com/fb-crm-datamind", publishedAt: now, source: { name: "Reuters" }, sector: "Technology", dealValue: "$6.1B", acquirer: "Salesforce", target: "DataMind" },
    { title: "Google Parent Alphabet Bids $12B for Cloud Security Leader ShieldAI", description: "Alphabet has submitted a $12 billion offer for cloud security company ShieldAI amid intensifying competition with Microsoft.", url: "https://example.com/fb-alphabet-shield", publishedAt: now, source: { name: "WSJ" }, sector: "Technology", dealValue: "$12B", acquirer: "Alphabet", target: "ShieldAI" },
    { title: "Oracle Targets SaaS Firm Nexum in $4.4B Acquisition Bid", description: "Oracle is seeking to acquire SaaS provider Nexum to expand its cloud ERP offering in the mid-market segment.", url: "https://example.com/fb-oracle-nexum", publishedAt: now, source: { name: "FT" }, sector: "Technology", dealValue: "$4.4B", acquirer: "Oracle", target: "Nexum" },
    { title: "Cisco Acquires Network Intelligence Platform NetPulse for $3.2B", description: "Cisco has agreed to buy network intelligence platform NetPulse to enhance its AI-driven operations portfolio.", url: "https://example.com/fb-cisco-netpulse", publishedAt: now, source: { name: "Bloomberg" }, sector: "Technology", dealValue: "$3.2B", acquirer: "Cisco", target: "NetPulse" },
    { title: "AMD in Talks to Buy Semiconductor Design House ChipForge for $2.7B", description: "AMD is negotiating the acquisition of ChipForge to accelerate its custom silicon roadmap for data centre workloads.", url: "https://example.com/fb-amd-chipforge", publishedAt: now, source: { name: "CNBC" }, sector: "Technology", dealValue: "$2.7B", acquirer: "AMD", target: "ChipForge" },
    { title: "SAP Acquires Supply Chain SaaS Vendor Logify for $1.9B", description: "SAP has signed a definitive agreement to acquire Logify, adding real-time supply chain intelligence to its S/4HANA suite.", url: "https://example.com/fb-sap-logify", publishedAt: now, source: { name: "Reuters" }, sector: "Technology", dealValue: "$1.9B", acquirer: "SAP", target: "Logify" },
    { title: "Palo Alto Networks Eyes Acquisition of SIEM Vendor SecureLog for $5.3B", description: "Palo Alto Networks is exploring a takeover of SecureLog to consolidate its security operations platform.", url: "https://example.com/fb-panw-securelog", publishedAt: now, source: { name: "Bloomberg" }, sector: "Technology", dealValue: "$5.3B", acquirer: "Palo Alto Networks", target: "SecureLog" },
    { title: "Snowflake Bids $2.4B for Data Catalogue Startup Atlan", description: "Snowflake has made a $2.4 billion offer for data catalogue startup Atlan to enhance its AI Data Cloud ecosystem.", url: "https://example.com/fb-snow-atlan", publishedAt: now, source: { name: "WSJ" }, sector: "Technology", dealValue: "$2.4B", acquirer: "Snowflake", target: "Atlan" },
    { title: "ServiceNow to Acquire Workflow Automation Firm FlowIQ for $3.8B", description: "ServiceNow is set to acquire FlowIQ, extending its Now Platform with advanced AI-driven process automation.", url: "https://example.com/fb-now-flowiq", publishedAt: now, source: { name: "FT" }, sector: "Technology", dealValue: "$3.8B", acquirer: "ServiceNow", target: "FlowIQ" },
    { title: "IBM Pursues $7.2B Acquisition of Hybrid Cloud Specialist NovaBridge", description: "IBM is in exclusive talks to acquire NovaBridge, a hybrid cloud management company, to strengthen its consulting and cloud services arm.", url: "https://example.com/fb-ibm-novabridge", publishedAt: now, source: { name: "Bloomberg" }, sector: "Technology", dealValue: "$7.2B", acquirer: "IBM", target: "NovaBridge" },
    { title: "Workday Acquires HR Analytics Platform TalentMetric for $1.5B", description: "Workday has agreed to buy TalentMetric, integrating AI-powered workforce analytics directly into its HCM suite.", url: "https://example.com/fb-wday-talentmetric", publishedAt: now, source: { name: "Reuters" }, sector: "Technology", dealValue: "$1.5B", acquirer: "Workday", target: "TalentMetric" },
    { title: "Nvidia Targets AI Inference Startup Morphic for $3.1B", description: "Nvidia is pursuing an acquisition of Morphic, an AI inference optimisation startup, to embed its technology in next-generation GPU software stacks.", url: "https://example.com/fb-nvda-morphic", publishedAt: now, source: { name: "CNBC" }, sector: "Technology", dealValue: "$3.1B", acquirer: "Nvidia", target: "Morphic" },
    { title: "Atlassian Agrees $900M Acquisition of Developer Platform Codestream", description: "Atlassian is acquiring Codestream to add real-time code review and collaboration features to its Jira and Confluence ecosystem.", url: "https://example.com/fb-team-codestream", publishedAt: now, source: { name: "WSJ" }, sector: "Technology", dealValue: "$900M", acquirer: "Atlassian", target: "Codestream" },
    { title: "Broadcom in Talks to Acquire Storage Software Vendor DataVault for $4.6B", description: "Broadcom is in advanced discussions to acquire DataVault, adding enterprise storage management software to its infrastructure portfolio.", url: "https://example.com/fb-avgo-datavault", publishedAt: now, source: { name: "Bloomberg" }, sector: "Technology", dealValue: "$4.6B", acquirer: "Broadcom", target: "DataVault" },
    // Healthcare (15)
    { title: "Pfizer in $4.1B Deal to Acquire Oncology Biotech NovaCure Sciences", description: "Pfizer is acquiring NovaCure Sciences to bolster its late-stage oncology pipeline with three Phase III candidates.", url: "https://example.com/fb-pfe-novacure", publishedAt: now, source: { name: "Reuters" }, sector: "Healthcare", dealValue: "$4.1B", acquirer: "Pfizer", target: "NovaCure Sciences" },
    { title: "AstraZeneca Bids $9.8B for Rare Disease Specialist GenePath", description: "AstraZeneca has made an offer of $9.8 billion for rare disease biotech GenePath, expanding its rare oncology franchise.", url: "https://example.com/fb-azn-genepath", publishedAt: now, source: { name: "Bloomberg" }, sector: "Healthcare", dealValue: "$9.8B", acquirer: "AstraZeneca", target: "GenePath" },
    { title: "Eli Lilly Acquires GLP-1 Drug Maker Metabolica for $6.3B", description: "Eli Lilly is buying Metabolica to secure additional GLP-1 receptor agonist assets for its expanding obesity and diabetes portfolio.", url: "https://example.com/fb-lly-metabolica", publishedAt: now, source: { name: "FT" }, sector: "Healthcare", dealValue: "$6.3B", acquirer: "Eli Lilly", target: "Metabolica" },
    { title: "Johnson & Johnson Eyes $5.5B Acquisition of MedTech Firm CardioLink", description: "J&J is exploring the acquisition of CardioLink to bolster its MedTech segment with next-generation cardiac monitoring devices.", url: "https://example.com/fb-jnj-cardiolink", publishedAt: now, source: { name: "WSJ" }, sector: "Healthcare", dealValue: "$5.5B", acquirer: "Johnson & Johnson", target: "CardioLink" },
    { title: "Roche Agrees $3.7B Deal for Immunotherapy Startup ImmunAxis", description: "Roche has signed a definitive agreement to acquire ImmunAxis, adding novel T-cell engager technology to its oncology pipeline.", url: "https://example.com/fb-rhhby-immunaxis", publishedAt: now, source: { name: "Reuters" }, sector: "Healthcare", dealValue: "$3.7B", acquirer: "Roche", target: "ImmunAxis" },
    { title: "Merck Acquires Gene Therapy Firm VectorBio for $2.9B", description: "Merck has agreed to acquire VectorBio, gaining a clinical-stage gene therapy platform targeting rare neurological disorders.", url: "https://example.com/fb-mrk-vectorbio", publishedAt: now, source: { name: "Bloomberg" }, sector: "Healthcare", dealValue: "$2.9B", acquirer: "Merck", target: "VectorBio" },
    { title: "Novartis Targets Digital Health Platform HealthSync for $1.8B", description: "Novartis is pursuing the acquisition of HealthSync to integrate AI-driven patient engagement tools into its commercialisation strategy.", url: "https://example.com/fb-nvs-healthsync", publishedAt: now, source: { name: "CNBC" }, sector: "Healthcare", dealValue: "$1.8B", acquirer: "Novartis", target: "HealthSync" },
    { title: "Abbott Laboratories Acquires Wearable Diagnostics Firm BioSense for $2.2B", description: "Abbott is buying BioSense to expand its continuous glucose monitoring portfolio with next-generation wearable biosensors.", url: "https://example.com/fb-abt-biosense", publishedAt: now, source: { name: "FT" }, sector: "Healthcare", dealValue: "$2.2B", acquirer: "Abbott Laboratories", target: "BioSense" },
    { title: "Bristol Myers Squibb Bids $7.4B for Haematology Biotech CellShield", description: "BMS has submitted a takeover offer for CellShield, whose lead asset targets relapsed/refractory multiple myeloma.", url: "https://example.com/fb-bmy-cellshield", publishedAt: now, source: { name: "WSJ" }, sector: "Healthcare", dealValue: "$7.4B", acquirer: "Bristol Myers Squibb", target: "CellShield" },
    { title: "Medtronic Acquires Surgical Robotics Startup PrecisionBot for $3.4B", description: "Medtronic is acquiring PrecisionBot to integrate soft-tissue surgical robotics into its global operating room solutions business.", url: "https://example.com/fb-mdt-precisionbot", publishedAt: now, source: { name: "Bloomberg" }, sector: "Healthcare", dealValue: "$3.4B", acquirer: "Medtronic", target: "PrecisionBot" },
    { title: "Gilead Sciences Eyes $4.8B Acquisition of Antiviral Startup ViralStop", description: "Gilead is in advanced talks to acquire ViralStop, adding a broad-spectrum antiviral platform to its infectious disease pipeline.", url: "https://example.com/fb-gild-viralstop", publishedAt: now, source: { name: "Reuters" }, sector: "Healthcare", dealValue: "$4.8B", acquirer: "Gilead Sciences", target: "ViralStop" },
    { title: "Sanofi Acquires mRNA Vaccine Platform Maker VaxGen for $5.1B", description: "Sanofi has agreed to buy VaxGen, securing proprietary mRNA lipid nanoparticle technology to compete with Pfizer-BioNTech.", url: "https://example.com/fb-sny-vaxgen", publishedAt: now, source: { name: "FT" }, sector: "Healthcare", dealValue: "$5.1B", acquirer: "Sanofi", target: "VaxGen" },
    { title: "Regeneron Acquires Ophthalmology Biotech RetinaRx for $2.6B", description: "Regeneron is buying RetinaRx to expand into gene-based treatments for inherited retinal diseases beyond its flagship VEGF franchise.", url: "https://example.com/fb-regn-retinarx", publishedAt: now, source: { name: "CNBC" }, sector: "Healthcare", dealValue: "$2.6B", acquirer: "Regeneron", target: "RetinaRx" },
    { title: "Thermo Fisher to Acquire Lab Automation Firm AutoLab for $1.7B", description: "Thermo Fisher Scientific is acquiring AutoLab to integrate robotic laboratory automation into its life sciences instruments segment.", url: "https://example.com/fb-tmo-autolab", publishedAt: now, source: { name: "Bloomberg" }, sector: "Healthcare", dealValue: "$1.7B", acquirer: "Thermo Fisher Scientific", target: "AutoLab" },
    { title: "UCB Acquires Neuroscience Startup NeuroPath for $3.0B", description: "UCB has agreed to acquire NeuroPath, adding a clinical-stage asset targeting treatment-resistant epilepsy to its CNS portfolio.", url: "https://example.com/fb-ucb-neuropath", publishedAt: now, source: { name: "Reuters" }, sector: "Healthcare", dealValue: "$3.0B", acquirer: "UCB", target: "NeuroPath" },
    // Financials (15)
    { title: "JPMorgan Chase Acquires Regional Bank Network MidFirst for $3.8B", description: "JPMorgan Chase is expanding its Midwest retail banking footprint via a $3.8 billion acquisition of 200-branch network MidFirst.", url: "https://example.com/fb-jpm-midfirst", publishedAt: now, source: { name: "FT" }, sector: "Financials", dealValue: "$3.8B", acquirer: "JPMorgan Chase", target: "MidFirst" },
    { title: "Goldman Sachs Acquires Wealth Tech Platform WealthOS for $1.4B", description: "Goldman Sachs is buying WealthOS to modernise its wealth management technology stack for ultra-high-net-worth clients.", url: "https://example.com/fb-gs-wealthos", publishedAt: now, source: { name: "Bloomberg" }, sector: "Financials", dealValue: "$1.4B", acquirer: "Goldman Sachs", target: "WealthOS" },
    { title: "Allianz Targets InsurTech Firm CoverAI in €2.3B Acquisition", description: "Allianz is pursuing the acquisition of CoverAI to embed AI-powered underwriting and claims automation across its European retail book.", url: "https://example.com/fb-alv-coverai", publishedAt: now, source: { name: "Reuters" }, sector: "Financials", dealValue: "€2.3B", acquirer: "Allianz", target: "CoverAI" },
    { title: "Visa Bids $2.9B for Open Banking Platform Finverge", description: "Visa has made a $2.9 billion offer for open banking infrastructure provider Finverge, seeking to diversify beyond card networks.", url: "https://example.com/fb-v-finverge", publishedAt: now, source: { name: "WSJ" }, sector: "Financials", dealValue: "$2.9B", acquirer: "Visa", target: "Finverge" },
    { title: "Morgan Stanley Acquires Fixed Income Analytics Firm BondIQ for $1.1B", description: "Morgan Stanley is buying BondIQ to strengthen its fixed income electronic trading and analytics capabilities for institutional clients.", url: "https://example.com/fb-ms-bondiq", publishedAt: now, source: { name: "Bloomberg" }, sector: "Financials", dealValue: "$1.1B", acquirer: "Morgan Stanley", target: "BondIQ" },
    { title: "HSBC Acquires Digital-Only Bank NeoBank Direct for $1.8B", description: "HSBC is acquiring NeoBank Direct to accelerate its retail digital transformation and expand its younger customer base in the UK.", url: "https://example.com/fb-hsbc-neobank", publishedAt: now, source: { name: "FT" }, sector: "Financials", dealValue: "$1.8B", acquirer: "HSBC", target: "NeoBank Direct" },
    { title: "Mastercard Agrees $3.5B Acquisition of Payments Risk Platform RiskGuard", description: "Mastercard is buying RiskGuard to integrate real-time fraud detection and chargeback automation across its global payments network.", url: "https://example.com/fb-ma-riskguard", publishedAt: now, source: { name: "CNBC" }, sector: "Financials", dealValue: "$3.5B", acquirer: "Mastercard", target: "RiskGuard" },
    { title: "BlackRock Acquires Infrastructure Debt Platform InfraCredit for $2.1B", description: "BlackRock is buying InfraCredit to expand its private markets infrastructure debt capabilities for institutional investors.", url: "https://example.com/fb-blk-infracredit", publishedAt: now, source: { name: "Reuters" }, sector: "Financials", dealValue: "$2.1B", acquirer: "BlackRock", target: "InfraCredit" },
    { title: "Stripe Targets Payments Compliance Firm RegTech Pro in $800M Deal", description: "Stripe is acquiring RegTech Pro to automate AML and KYC compliance workflows for its growing base of enterprise merchants.", url: "https://example.com/fb-stripe-regtech", publishedAt: now, source: { name: "Bloomberg" }, sector: "Financials", dealValue: "$800M", acquirer: "Stripe", target: "RegTech Pro" },
    { title: "Deutsche Bank Acquires Asset Manager EuroFund for €1.6B", description: "Deutsche Bank is buying EuroFund to scale its asset management business and compete with global passive investing giants.", url: "https://example.com/fb-db-eurofund", publishedAt: now, source: { name: "FT" }, sector: "Financials", dealValue: "€1.6B", acquirer: "Deutsche Bank", target: "EuroFund" },
    { title: "Fidelity Investments Acquires Crypto Custody Platform VaultChain for $1.2B", description: "Fidelity is buying VaultChain to build out institutional-grade digital asset custody and trading services for its wealth management clients.", url: "https://example.com/fb-fid-vaultchain", publishedAt: now, source: { name: "WSJ" }, sector: "Financials", dealValue: "$1.2B", acquirer: "Fidelity Investments", target: "VaultChain" },
    { title: "Aon Acquires Employee Benefits Platform BenefitIQ for $950M", description: "Aon is buying BenefitIQ to integrate AI-driven benefits administration and analytics into its human capital solutions business.", url: "https://example.com/fb-aon-benefitiq", publishedAt: now, source: { name: "Bloomberg" }, sector: "Financials", dealValue: "$950M", acquirer: "Aon", target: "BenefitIQ" },
    { title: "Schroders Bids £1.3B for Sustainable Investing Platform GreenPortfolio", description: "Schroders has made a £1.3 billion offer for GreenPortfolio to accelerate its ESG and sustainable investment product range.", url: "https://example.com/fb-sdr-greenportfolio", publishedAt: now, source: { name: "Reuters" }, sector: "Financials", dealValue: "£1.3B", acquirer: "Schroders", target: "GreenPortfolio" },
    { title: "Revolut Acquires European Stockbroker TradingPoint for €700M", description: "Revolut is buying TradingPoint to add EU-regulated brokerage services to its super-app, competing directly with eToro and Degiro.", url: "https://example.com/fb-revolut-tradingpoint", publishedAt: now, source: { name: "FT" }, sector: "Financials", dealValue: "€700M", acquirer: "Revolut", target: "TradingPoint" },
    { title: "American Express Acquires SME Lending Platform QuickLend for $1.6B", description: "American Express is buying QuickLend to offer embedded financing products to its 10 million small business card customers.", url: "https://example.com/fb-axp-quicklend", publishedAt: now, source: { name: "CNBC" }, sector: "Financials", dealValue: "$1.6B", acquirer: "American Express", target: "QuickLend" },
    // Private Equity (15)
    { title: "Apollo Global Targets UK Retailer in £3.2B Leveraged Buyout", description: "Apollo Global Management is pursuing a leveraged buyout of a major UK retailer to take it private.", url: "https://example.com/fb-apo-ukretail", publishedAt: now, source: { name: "FT" }, sector: "Private Equity", dealValue: "£3.2B", acquirer: "Apollo Global", target: "UK Retailer Group" },
    { title: "Blackstone Acquires Data Centre REIT for $6.7B Amid AI Boom", description: "Blackstone has agreed to acquire a data centre REIT for $6.7 billion, betting on surging AI-driven compute infrastructure demand.", url: "https://example.com/fb-bx-dcreit", publishedAt: now, source: { name: "WSJ" }, sector: "Private Equity", dealValue: "$6.7B", acquirer: "Blackstone", target: "DataCentre REIT" },
    { title: "KKR Agrees $5.4B Take-Private of Software Firm AppSuite", description: "KKR has entered a definitive agreement to take AppSuite private at a 32% premium.", url: "https://example.com/fb-kkr-appsuite", publishedAt: now, source: { name: "Bloomberg" }, sector: "Private Equity", dealValue: "$5.4B", acquirer: "KKR", target: "AppSuite" },
    { title: "Carlyle Group Bids €3.6B for European Industrial Conglomerate Eurotech", description: "Carlyle has submitted an all-cash offer for Eurotech, targeting operational improvements across its diversified industrial units.", url: "https://example.com/fb-cg-eurotech", publishedAt: now, source: { name: "Reuters" }, sector: "Private Equity", dealValue: "€3.6B", acquirer: "Carlyle Group", target: "Eurotech" },
    { title: "Warburg Pincus Acquires Healthcare Services Chain MedCare for $2.3B", description: "Warburg Pincus is buying MedCare, a 300-clinic healthcare services chain, to consolidate primary care in high-growth urban markets.", url: "https://example.com/fb-wp-medcare", publishedAt: now, source: { name: "FT" }, sector: "Private Equity", dealValue: "$2.3B", acquirer: "Warburg Pincus", target: "MedCare" },
    { title: "CVC Capital Targets Logistics Group FastFreight in €2.8B Buyout", description: "CVC Capital Partners is pursuing a leveraged buyout of FastFreight, a European last-mile logistics operator.", url: "https://example.com/fb-cvc-fastfreight", publishedAt: now, source: { name: "Bloomberg" }, sector: "Private Equity", dealValue: "€2.8B", acquirer: "CVC Capital", target: "FastFreight" },
    { title: "TPG Acquires Education Technology Platform LearnPath for $1.8B", description: "TPG has agreed to acquire LearnPath, an edtech platform serving 4 million students, with plans to accelerate international expansion.", url: "https://example.com/fb-tpg-learnpath", publishedAt: now, source: { name: "CNBC" }, sector: "Private Equity", dealValue: "$1.8B", acquirer: "TPG", target: "LearnPath" },
    { title: "Advent International Eyes $4.1B Buyout of Specialty Chemicals Firm ChemWorks", description: "Advent International is pursuing a take-private of ChemWorks to carve it out from its parent conglomerate.", url: "https://example.com/fb-advent-chemworks", publishedAt: now, source: { name: "WSJ" }, sector: "Private Equity", dealValue: "$4.1B", acquirer: "Advent International", target: "ChemWorks" },
    { title: "Bain Capital Acquires Consumer Brands Group NaturePure for $2.6B", description: "Bain Capital is buying NaturePure to build a platform of premium health-and-wellness consumer brands.", url: "https://example.com/fb-bc-naturepure", publishedAt: now, source: { name: "Reuters" }, sector: "Private Equity", dealValue: "$2.6B", acquirer: "Bain Capital", target: "NaturePure" },
    { title: "Silver Lake Partners Bids $7.8B for Enterprise Software Group TechGroup", description: "Silver Lake Partners has made an offer to take enterprise software conglomerate TechGroup private at a 28% premium.", url: "https://example.com/fb-sl-techgroup", publishedAt: now, source: { name: "Bloomberg" }, sector: "Private Equity", dealValue: "$7.8B", acquirer: "Silver Lake Partners", target: "TechGroup" },
    { title: "General Atlantic Acquires Fintech Payments Gateway PayRoute for $1.5B", description: "General Atlantic has agreed to acquire PayRoute, a B2B payments gateway serving 50,000 SMEs.", url: "https://example.com/fb-ga-payroute", publishedAt: now, source: { name: "FT" }, sector: "Private Equity", dealValue: "$1.5B", acquirer: "General Atlantic", target: "PayRoute" },
    { title: "EQT Partners Targets Nordic Pharmacy Chain NordMed for €1.9B", description: "EQT Partners is pursuing a buyout of NordMed to create a pan-Nordic omnichannel pharmacy platform.", url: "https://example.com/fb-eqt-nordmed", publishedAt: now, source: { name: "Reuters" }, sector: "Private Equity", dealValue: "€1.9B", acquirer: "EQT Partners", target: "NordMed" },
    { title: "Vista Equity Partners Acquires Legal Software Firm LexTech for $3.3B", description: "Vista Equity Partners is taking LexTech private to accelerate its AI-powered contract intelligence platform.", url: "https://example.com/fb-vista-lextech", publishedAt: now, source: { name: "CNBC" }, sector: "Private Equity", dealValue: "$3.3B", acquirer: "Vista Equity Partners", target: "LexTech" },
    { title: "Permira Acquires Online Travel Platform TravelNow for €2.1B", description: "Permira has agreed to acquire TravelNow, an online travel agency with 30 million monthly users.", url: "https://example.com/fb-perm-travelnow", publishedAt: now, source: { name: "FT" }, sector: "Private Equity", dealValue: "€2.1B", acquirer: "Permira", target: "TravelNow" },
    { title: "PAI Partners Eyes £1.7B Buyout of Food Manufacturer TasteFirst", description: "PAI Partners is pursuing a leveraged buyout of TasteFirst, a UK food manufacturer, to build a branded ambient foods platform.", url: "https://example.com/fb-pai-tastefirst", publishedAt: now, source: { name: "Bloomberg" }, sector: "Private Equity", dealValue: "£1.7B", acquirer: "PAI Partners", target: "TasteFirst" },
    // Energy (15)
    { title: "ExxonMobil Agrees $9.3B Acquisition of LNG Producer PacificGas", description: "ExxonMobil has signed a definitive agreement to acquire LNG producer PacificGas, expanding its global natural gas footprint.", url: "https://example.com/fb-xom-pacificgas", publishedAt: now, source: { name: "Reuters" }, sector: "Energy", dealValue: "$9.3B", acquirer: "ExxonMobil", target: "PacificGas" },
    { title: "Shell Bids $7.1B for Renewable Energy Platform GreenPower Holdings", description: "Shell has made an all-cash offer for GreenPower Holdings to accelerate its offshore wind and solar transition targets.", url: "https://example.com/fb-shel-greenpower", publishedAt: now, source: { name: "Bloomberg" }, sector: "Energy", dealValue: "$7.1B", acquirer: "Shell", target: "GreenPower Holdings" },
    { title: "BP Acquires US Solar Developer SunRise Energy for $4.5B", description: "BP is buying SunRise Energy to add 8GW of US solar development pipeline to its low-carbon energy transition portfolio.", url: "https://example.com/fb-bp-sunrise", publishedAt: now, source: { name: "FT" }, sector: "Energy", dealValue: "$4.5B", acquirer: "BP", target: "SunRise Energy" },
    { title: "TotalEnergies Eyes $5.8B Acquisition of Offshore Wind Firm WindFarm Global", description: "TotalEnergies has entered exclusivity for the acquisition of WindFarm Global, a leading developer of floating offshore wind assets.", url: "https://example.com/fb-tte-windfarm", publishedAt: now, source: { name: "WSJ" }, sector: "Energy", dealValue: "$5.8B", acquirer: "TotalEnergies", target: "WindFarm Global" },
    { title: "Chevron Acquires Deepwater Exploration Company OceanDrill for $6.2B", description: "Chevron has agreed to acquire OceanDrill to gain access to significant deepwater reserves in the Gulf of Mexico.", url: "https://example.com/fb-cvx-oceandrill", publishedAt: now, source: { name: "CNBC" }, sector: "Energy", dealValue: "$6.2B", acquirer: "Chevron", target: "OceanDrill" },
    { title: "Rio Tinto Acquires Lithium Miner LithiumCo for $3.7B", description: "Rio Tinto is buying LithiumCo to secure long-term lithium supply for the EV battery supply chain transition.", url: "https://example.com/fb-rio-lithiumco", publishedAt: now, source: { name: "Reuters" }, sector: "Energy", dealValue: "$3.7B", acquirer: "Rio Tinto", target: "LithiumCo" },
    { title: "Enbridge Agrees $4.9B Purchase of Natural Gas Storage Network StoreCo", description: "Enbridge is acquiring StoreCo's network of 12 natural gas storage facilities to strengthen its North American midstream position.", url: "https://example.com/fb-enb-storeco", publishedAt: now, source: { name: "Bloomberg" }, sector: "Energy", dealValue: "$4.9B", acquirer: "Enbridge", target: "StoreCo" },
    { title: "NextEra Energy Bids $8.4B for Utility Grid Operator PowerGrid Eastern", description: "NextEra Energy has made a takeover proposal for PowerGrid Eastern to consolidate regulated utility assets across the US East Coast.", url: "https://example.com/fb-nee-powergrid", publishedAt: now, source: { name: "WSJ" }, sector: "Energy", dealValue: "$8.4B", acquirer: "NextEra Energy", target: "PowerGrid Eastern" },
    { title: "BHP Acquires Copper Miner CopperCore for $5.3B", description: "BHP has agreed to acquire CopperCore to secure tier-1 copper assets essential to its electrification and energy transition strategy.", url: "https://example.com/fb-bhp-coppercore", publishedAt: now, source: { name: "FT" }, sector: "Energy", dealValue: "$5.3B", acquirer: "BHP", target: "CopperCore" },
    { title: "Equinor Acquires Hydrogen Production Company HydrogenFirst for $2.4B", description: "Equinor is buying HydrogenFirst to build green hydrogen production capacity as part of its net-zero strategy.", url: "https://example.com/fb-eqnr-hydrogenfirst", publishedAt: now, source: { name: "Bloomberg" }, sector: "Energy", dealValue: "$2.4B", acquirer: "Equinor", target: "HydrogenFirst" },
    { title: "Glencore Bids $3.1B for Coal Mining Business of ConglomerateCo", description: "Glencore has made an offer for ConglomerateCo's thermal coal mining division to consolidate its commodity trading position.", url: "https://example.com/fb-glen-coal", publishedAt: now, source: { name: "Reuters" }, sector: "Energy", dealValue: "$3.1B", acquirer: "Glencore", target: "ConglomerateCo Coal" },
    { title: "Sempra Energy Acquires LNG Export Terminal TerminalGulf for $6.8B", description: "Sempra Energy has signed a purchase agreement for TerminalGulf, adding 10 Mtpa of US LNG export capacity.", url: "https://example.com/fb-sre-terminalgulf", publishedAt: now, source: { name: "CNBC" }, sector: "Energy", dealValue: "$6.8B", acquirer: "Sempra Energy", target: "TerminalGulf" },
    { title: "Vattenfall Acquires Battery Storage Developer StoragePlus for €1.9B", description: "Vattenfall is buying StoragePlus to build a 10GWh grid-scale battery storage portfolio across Northern Europe by 2028.", url: "https://example.com/fb-vatt-storageplus", publishedAt: now, source: { name: "FT" }, sector: "Energy", dealValue: "€1.9B", acquirer: "Vattenfall", target: "StoragePlus" },
    { title: "ConocoPhillips Eyes $5.0B Acquisition of Permian Basin Operator ShaleX", description: "ConocoPhillips is in advanced talks to acquire ShaleX, gaining 800 million barrels of Permian Basin proved reserves.", url: "https://example.com/fb-cop-shalex", publishedAt: now, source: { name: "Bloomberg" }, sector: "Energy", dealValue: "$5.0B", acquirer: "ConocoPhillips", target: "ShaleX" },
    { title: "Orsted Acquires Floating Wind Developer FloatWind for €2.7B", description: "Orsted has agreed to acquire FloatWind to commercialise floating offshore wind technology and access deepwater markets in Asia-Pacific.", url: "https://example.com/fb-orsted-floatwind", publishedAt: now, source: { name: "Reuters" }, sector: "Energy", dealValue: "€2.7B", acquirer: "Orsted", target: "FloatWind" },
    // Industrials (15)
    { title: "Siemens Acquires Industrial Automation Firm AutomationTech for €2.1B", description: "Siemens has agreed to acquire AutomationTech to expand its factory automation capabilities across the European industrial base.", url: "https://example.com/fb-sie-autotech", publishedAt: now, source: { name: "Bloomberg" }, sector: "Industrials", dealValue: "€2.1B", acquirer: "Siemens", target: "AutomationTech" },
    { title: "Honeywell Bids $4.3B for Industrial IoT Platform SensorGrid", description: "Honeywell has made a $4.3 billion offer for SensorGrid to integrate AI-powered industrial monitoring across its Building and Process segments.", url: "https://example.com/fb-hon-sensorgrid", publishedAt: now, source: { name: "WSJ" }, sector: "Industrials", dealValue: "$4.3B", acquirer: "Honeywell", target: "SensorGrid" },
    { title: "Raytheon Technologies Acquires Defence Electronics Firm StealthTech for $3.6B", description: "Raytheon Technologies is buying StealthTech to enhance its electronic warfare and radar capabilities for next-generation defence platforms.", url: "https://example.com/fb-rtx-stealthtech", publishedAt: now, source: { name: "Reuters" }, sector: "Industrials", dealValue: "$3.6B", acquirer: "Raytheon Technologies", target: "StealthTech" },
    { title: "Caterpillar Acquires Mining Equipment Maker MineMax for $2.8B", description: "Caterpillar is acquiring MineMax to complement its autonomous mining equipment with advanced ore-sorting and processing technologies.", url: "https://example.com/fb-cat-minemax", publishedAt: now, source: { name: "Bloomberg" }, sector: "Industrials", dealValue: "$2.8B", acquirer: "Caterpillar", target: "MineMax" },
    { title: "GE Aerospace Targets Aviation MRO Provider AeroFix for $2.2B", description: "GE Aerospace is pursuing the acquisition of AeroFix to capture aftermarket service revenue from its growing installed engine base.", url: "https://example.com/fb-ge-aerofix", publishedAt: now, source: { name: "FT" }, sector: "Industrials", dealValue: "$2.2B", acquirer: "GE Aerospace", target: "AeroFix" },
    { title: "3M Bids $1.9B for Advanced Adhesives Specialist BondTech", description: "3M has entered exclusive negotiations to acquire BondTech, adding structural adhesives for aerospace and EV battery assembly.", url: "https://example.com/fb-mmm-bondtech", publishedAt: now, source: { name: "CNBC" }, sector: "Industrials", dealValue: "$1.9B", acquirer: "3M", target: "BondTech" },
    { title: "Emerson Electric Acquires Process Control Software Maker FlowControl for $3.1B", description: "Emerson Electric is buying FlowControl to integrate digital process control software into its intelligent automation platform for refineries.", url: "https://example.com/fb-emr-flowcontrol", publishedAt: now, source: { name: "WSJ" }, sector: "Industrials", dealValue: "$3.1B", acquirer: "Emerson Electric", target: "FlowControl" },
    { title: "Airbus Acquires Urban Air Mobility Startup SkyLift for €1.6B", description: "Airbus has agreed to acquire SkyLift, gaining certified eVTOL aircraft technology to enter the urban air mobility market.", url: "https://example.com/fb-air-skylift", publishedAt: now, source: { name: "Reuters" }, sector: "Industrials", dealValue: "€1.6B", acquirer: "Airbus", target: "SkyLift" },
    { title: "Parker Hannifin Acquires Hydraulics Firm FluidPower for $2.5B", description: "Parker Hannifin is buying FluidPower to consolidate industrial hydraulics and motion control for heavy equipment OEMs globally.", url: "https://example.com/fb-ph-fluidpower", publishedAt: now, source: { name: "Bloomberg" }, sector: "Industrials", dealValue: "$2.5B", acquirer: "Parker Hannifin", target: "FluidPower" },
    { title: "Schneider Electric Bids €3.4B for Grid Management Firm GridLogic", description: "Schneider Electric has made a €3.4 billion offer for GridLogic to strengthen its energy management software for utilities and microgrids.", url: "https://example.com/fb-su-gridlogic", publishedAt: now, source: { name: "FT" }, sector: "Industrials", dealValue: "€3.4B", acquirer: "Schneider Electric", target: "GridLogic" },
    { title: "KION Group Acquires Warehouse Robotics Firm RoboStack for €1.4B", description: "KION Group is buying RoboStack to integrate autonomous mobile robots into its warehouse automation systems for e-commerce clients.", url: "https://example.com/fb-kion-robostack", publishedAt: now, source: { name: "Reuters" }, sector: "Industrials", dealValue: "€1.4B", acquirer: "KION Group", target: "RoboStack" },
    { title: "Textron Acquires Unmanned Aerial Systems Maker DronePro for $1.7B", description: "Textron is acquiring DronePro to expand its Bell and Textron Systems divisions into autonomous surveillance drone systems for defence.", url: "https://example.com/fb-txt-dronepro", publishedAt: now, source: { name: "CNBC" }, sector: "Industrials", dealValue: "$1.7B", acquirer: "Textron", target: "DronePro" },
    { title: "DSV Acquires Freight Forwarder CargoWorld for €4.2B", description: "DSV has agreed to acquire CargoWorld, adding air, sea and road freight capacity across 60 countries.", url: "https://example.com/fb-dsv-cargoworld", publishedAt: now, source: { name: "Bloomberg" }, sector: "Industrials", dealValue: "€4.2B", acquirer: "DSV", target: "CargoWorld" },
    { title: "Thyssenkrupp Agrees €2.3B Sale of Steel Division to PE Consortium", description: "Thyssenkrupp has reached agreement to divest its European steel unit to a private equity consortium in a structured carve-out.", url: "https://example.com/fb-tk-steel", publishedAt: now, source: { name: "FT" }, sector: "Industrials", dealValue: "€2.3B", acquirer: "PE Consortium", target: "Thyssenkrupp Steel" },
    { title: "Eaton Corporation Acquires Power Distribution Firm VoltGrid for $3.0B", description: "Eaton is buying VoltGrid to add intelligent power distribution infrastructure for data centres, a high-growth segment driven by AI demand.", url: "https://example.com/fb-etn-voltgrid", publishedAt: now, source: { name: "WSJ" }, sector: "Industrials", dealValue: "$3.0B", acquirer: "Eaton Corporation", target: "VoltGrid" },
  ];
}
