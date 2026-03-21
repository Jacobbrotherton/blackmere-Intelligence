import { notFound } from "next/navigation";
import DealDetailClient from "./DealDetailClient";

interface PageProps {
  params: { dealId: string };
}

export default function DealDetailPage({ params }: PageProps) {
  if (!params.dealId) notFound();
  // All data fetching is now done client-side via Groq — no FMP calls
  return <DealDetailClient dealId={params.dealId} />;
}
