"use client";

import { useRouter } from "next/navigation";
import GradientButton from "@/components/ui/gradient-button";

export default function StockAnalysisNavButton() {
  const router = useRouter();
  return (
    <GradientButton
      width="148px"
      height="30px"
      onClick={() => router.push("/stock-analysis")}
    >
      Stock Analysis
    </GradientButton>
  );
}
