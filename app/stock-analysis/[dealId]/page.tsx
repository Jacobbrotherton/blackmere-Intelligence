import { rumouredDeals } from "@/lib/rumoured-deals";
import { getCompanyProfile, getQuote, getKeyMetrics, getIncomeStatement } from "@/lib/fmp";
import { notFound } from "next/navigation";
import DealDetailClient from "./DealDetailClient";

interface PageProps {
  params: { dealId: string };
}

export default async function DealDetailPage({ params }: PageProps) {
  const deal = rumouredDeals.find((d) => d.id === params.dealId);
  if (!deal) notFound();

  const [acquirerProfile, acquirerQuote, acquirerMetrics, acquirerIncome] =
    deal.acquirerTicker !== "PRIVATE"
      ? await Promise.all([
          getCompanyProfile(deal.acquirerTicker),
          getQuote(deal.acquirerTicker),
          getKeyMetrics(deal.acquirerTicker),
          getIncomeStatement(deal.acquirerTicker, 2),
        ])
      : [null, null, null, null];

  const [targetProfile, targetQuote, targetMetrics, targetIncome] =
    deal.targetTicker !== "PRIVATE"
      ? await Promise.all([
          getCompanyProfile(deal.targetTicker),
          getQuote(deal.targetTicker),
          getKeyMetrics(deal.targetTicker),
          getIncomeStatement(deal.targetTicker, 2),
        ])
      : [null, null, null, null];

  return (
    <DealDetailClient
      deal={deal}
      acquirerData={{
        profile: acquirerProfile?.[0] ?? null,
        quote: acquirerQuote?.[0] ?? null,
        metrics: acquirerMetrics?.[0] ?? null,
        income: acquirerIncome ?? null,
      }}
      targetData={{
        profile: targetProfile?.[0] ?? null,
        quote: targetQuote?.[0] ?? null,
        metrics: targetMetrics?.[0] ?? null,
        income: targetIncome ?? null,
      }}
    />
  );
}
