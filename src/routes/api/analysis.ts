import { createFileRoute } from "@tanstack/react-router";
import { handleAnalysis } from "@/lib/ai/analysis.server";

export const Route = createFileRoute("/api/analysis")({
  server: { handlers: { POST: ({ request }) => handleAnalysis(request) } },
});