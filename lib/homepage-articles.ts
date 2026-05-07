import type { Article } from "@/lib/news";

// Hardcoded M&A homepage articles — refreshed 7 May 2026
// Update this file weekly with the latest confirmed M&A news

export const homepageArticles: Article[] = [
  {
    title: "Devon Energy Completes All-Stock Merger with Coterra Energy, Creating $58B Shale Giant",
    description:
      "Devon Energy and Coterra Energy completed their all-stock merger on 7 May 2026, with shareholders approving the combination at special meetings on 4 May. Each Coterra share converted into 0.70 Devon shares; Devon holders retain approximately 54% of the enlarged group. The combined company targets $1 billion in annual pre-tax synergies by 2027, anchored by a leading position in the Delaware Basin.",
    url: "https://worldoil.com/news/2026/5/7/devon-completes-coterra-merger-expands-delaware-basin-position/",
    publishedAt: "2026-05-07T12:00:00Z",
    source: { name: "World Oil" },
    sector: "Energy",
    dealValue: "$58B",
    acquirer: "Devon Energy",
    target: "Coterra Energy",
  },
  {
    title: "Warner Bros. Discovery Shareholders Approve $111B Paramount Merger — Regulators Up Next",
    description:
      "Warner Bros. Discovery shareholders voted overwhelmingly to approve Paramount Skydance's $111 billion takeover on 23 April 2026, with 1.743 billion shares in favour and only 16.3 million opposed. The deal — which values WBD shares at $31 in cash — still requires DOJ and FCC clearance. Close is targeted for Q3 2026, though a 49.5% Middle Eastern ownership stake has drawn FCC scrutiny.",
    url: "https://www.npr.org/2026/04/23/nx-s1-5793979/warner-bros-discover-approves-110b-paramount-skydance-merger-regulators-up-next",
    publishedAt: "2026-04-23T18:00:00Z",
    source: { name: "NPR" },
    sector: "Media",
    dealValue: "$111B",
    acquirer: "Paramount Skydance",
    target: "Warner Bros. Discovery",
  },
  {
    title: "Sun Pharma Agrees $11.75B Deal to Acquire Organon, Marking Largest M&A Transaction of 2026",
    description:
      "Indian generics giant Sun Pharmaceutical Industries signed a definitive agreement in April 2026 to acquire U.S. healthcare company Organon & Co. for approximately $11.75 billion. The deal — the largest M&A transaction of 2026 to date — gives Sun Pharma access to Organon's biosimilars portfolio, women's health franchises, and commercial operations across 140+ markets worldwide.",
    url: "https://cen.acs.org/business/mergers-&-acquisitions/sun-pharma-buy-organon-biosimilars/104/web/2026/04",
    publishedAt: "2026-04-22T09:00:00Z",
    source: { name: "C&EN" },
    sector: "Healthcare",
    dealValue: "$11.75B",
    acquirer: "Sun Pharmaceutical",
    target: "Organon",
  },
  {
    title: "Amazon to Acquire Globalstar for $11.6B to Build Amazon Leo Satellite Network",
    description:
      "Amazon agreed on 14 April 2026 to acquire satellite operator Globalstar in an $11.6 billion all-cash deal at $90 per share, enabling the creation of Amazon Leo — a direct-to-device LEO satellite network. Amazon simultaneously announced a partnership with Apple to power satellite-based Emergency SOS services for iPhone and Apple Watch. Close is expected in 2027 pending FCC spectrum and antitrust approvals.",
    url: "https://www.cnbc.com/2026/04/14/amazon-globalstar-satellite-leo-internet.html",
    publishedAt: "2026-04-14T13:00:00Z",
    source: { name: "CNBC" },
    sector: "Technology",
    dealValue: "$11.6B",
    acquirer: "Amazon",
    target: "Globalstar",
  },
  {
    title: "QXO to Acquire TopBuild for $17B in Landmark Building Products Deal",
    description:
      "QXO announced on 19 April 2026 a definitive agreement to acquire TopBuild Corp. for approximately $17 billion — the largest building products distribution deal in decades. At $505 per share (a 23.1% premium), the consideration is 45% cash and 55% QXO stock. The deal creates the second-largest publicly traded building products distributor in North America with over $18 billion in combined revenue.",
    url: "https://www.bloomberg.com/news/articles/2026-04-19/qxo-to-buy-topbuild-for-17-billion-in-building-products-deal",
    publishedAt: "2026-04-19T10:00:00Z",
    source: { name: "Bloomberg" },
    sector: "Industrials",
    dealValue: "$17B",
    acquirer: "QXO",
    target: "TopBuild",
  },
  {
    title: "Allegiant Set to Close $1.5B Sun Country Airlines Acquisition as Shareholder Votes Near",
    description:
      "Allegiant Travel Company and Sun Country Airlines held shareholder special meetings on 8 May 2026 ahead of an anticipated closing as early as 13 May. The $1.5 billion all-cash and stock deal — announced in January 2026 — cleared DOT regulatory approval in April and received early HSR termination. The combined airline will serve approximately 22 million customers across nearly 175 cities.",
    url: "https://ir.allegiantair.com/news/news-details/2026/Allegiant-and-Sun-Country-Airlines-to-Combine-Creating-a-Leading-More-Competitive-Leisure-Focused-U-S--Airline/default.aspx",
    publishedAt: "2026-05-08T08:00:00Z",
    source: { name: "Allegiant IR" },
    sector: "Airlines",
    dealValue: "$1.5B",
    acquirer: "Allegiant Travel",
    target: "Sun Country Airlines",
  },
  {
    title: "Gilead Sciences Acquires ADC Biotech Tubulis for Up to $5B to Expand Oncology Pipeline",
    description:
      "Gilead Sciences agreed on 7 April 2026 to acquire Munich-based antibody-drug conjugate biotech Tubulis for $3.15 billion upfront plus up to $1.85 billion in milestones. Tubulis's lead asset TUB-040 targets NaPi2b-expressing tumours, showing a 59% overall response rate in platinum-resistant ovarian cancer. The deal is part of Gilead's broader pivot toward oncology through a string of spring 2026 acquisitions.",
    url: "https://www.statnews.com/2026/04/07/gilead-sciences-acquisition-tubulis-adcs-chemotherapy-cancer/",
    publishedAt: "2026-04-07T11:00:00Z",
    source: { name: "STAT News" },
    sector: "Biotech",
    dealValue: "$5B",
    acquirer: "Gilead Sciences",
    target: "Tubulis",
  },
  {
    title: "Gilead Sciences Acquires CAR-T Developer Arcellx for $7.8B in Haematology Push",
    description:
      "Gilead Sciences closed its $7.8 billion acquisition of CAR-T therapy developer Arcellx in April 2026. Arcellx's lead asset anito-cel targets relapsed/refractory multiple myeloma — a competitive indication — with Phase 3 data and an expected FDA filing later this year. Post-close, Gilead trimmed approximately 192 positions at Arcellx's Redwood City and Rockville sites as integration began.",
    url: "https://www.gilead.com/news/news-details/2026/gilead-sciences-to-acquire-arcellx-to-maximize-long-term-potential-of-anito-cel",
    publishedAt: "2026-04-10T09:00:00Z",
    source: { name: "Gilead Sciences" },
    sector: "Biotech",
    dealValue: "$7.8B",
    acquirer: "Gilead Sciences",
    target: "Arcellx",
  },
  {
    title: "FCC Approves Charter's $34.5B Cox Acquisition — California Remains Final Hurdle",
    description:
      "The FCC Wireline Competition Bureau approved Charter Communications' $34.5 billion acquisition of Cox Enterprises on 27 February 2026, creating the largest US internet service provider with over 37 million broadband subscribers. The approval came with job protection commitments including a $20/hour minimum wage and onshoring of all offshore functions. California's Public Utilities Commission remains the sole outstanding approval ahead of a September 2026 deadline.",
    url: "https://deadline.com/2026/02/charter-cox-merger-fcc-1236738909/",
    publishedAt: "2026-02-27T15:00:00Z",
    source: { name: "Deadline" },
    sector: "Telecom",
    dealValue: "$34.5B",
    acquirer: "Charter Communications",
    target: "Cox Communications",
  },
  {
    title: "FCC Commissioner Demands Scrutiny of Paramount-WBD Deal Over 49.5% Middle Eastern Ownership",
    description:
      "FCC Commissioner Brendan Carr publicly called for heightened review of the Paramount-Warner Bros. Discovery merger in May 2026, following Paramount's disclosure that the combined entity will be 49.5% owned by Middle Eastern sovereign wealth funds — Saudi PIF (15.1%), UAE sovereign fund (12.8%), and Qatar Investment Authority (10.6%). Paramount filed an FCC petition seeking Section 310(b)(4) approval for the foreign ownership stake.",
    url: "https://deadline.com/2026/05/fcc-paramount-warner-bros-foreign-ownership-1236882088/",
    publishedAt: "2026-05-04T14:00:00Z",
    source: { name: "Deadline" },
    sector: "Media",
    dealValue: "$111B",
    acquirer: "Paramount Skydance",
    target: "Warner Bros. Discovery",
  },
  {
    title: "Paramount Subpoenaed by Multiple State AGs Over Warner Bros. Discovery Merger",
    description:
      "Paramount Skydance disclosed in an SEC filing that it has received subpoenas or Civil Investigative Demands from various state attorneys general in connection with its planned merger with Warner Bros. Discovery. The state-level investigations — understood to include New York and California — examine consumer protection, local news impacts, and antitrust concerns, adding a new layer of legal risk to the $111 billion deal.",
    url: "https://www.mlex.com/mlex/articles/2473443/paramount-subpoenaed-by-various-state-ags-on-warner-bros-merger-us-sec-filing-says",
    publishedAt: "2026-05-01T10:00:00Z",
    source: { name: "MLex" },
    sector: "Media",
    dealValue: "$111B",
    acquirer: "Paramount Skydance",
    target: "Warner Bros. Discovery",
  },
  {
    title: "Gilead Sciences Acquires Ouro Medicines for $2.18B to Enter T-Cell Engager Autoimmune Market",
    description:
      "Gilead Sciences agreed in April 2026 to acquire Ouro Medicines for up to $2.18 billion, gaining a novel T-cell engager platform targeting autoimmune diseases including rheumatoid arthritis, lupus, and inflammatory bowel disease. The deal marks Gilead's entry into immunology beyond its virology roots and completes a six-week acquisition spree — alongside Arcellx and Tubulis — that will generate $11.5 billion in 2026 acquisition charges.",
    url: "https://www.gilead.com/news/news-details/2026/gilead-sciences-to-acquire-ouro-medicines-to-advance-first-in-class-t-cell-engager-program-for-autoimmune-diseases",
    publishedAt: "2026-04-15T10:00:00Z",
    source: { name: "Gilead Sciences" },
    sector: "Biotech",
    dealValue: "$2.18B",
    acquirer: "Gilead Sciences",
    target: "Ouro Medicines",
  },
];
