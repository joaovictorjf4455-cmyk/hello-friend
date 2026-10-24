import { useEffect, useRef, useState } from "react";
import { BrainCircuit, LoaderCircle, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisData } from "@/lib/barber-analysis";

export function MonthlyAnalysis({ data }: { data: AnalysisData }) {
  const [text, setText] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function analyze() {
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setText(""); setReasoning(""); setError("");
    try {
      const response = await fetch("/api/analysis", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), signal: controller.signal });
      if (!response.ok) { const failure = await response.json(); throw new Error(failure.message ?? "Não foi possível iniciar a análise."); }
      if (!response.body) throw new Error("A IA não retornou uma resposta.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const chunk = await reader.read(); if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const events = buffer.split("\n\n"); buffer = events.pop() ?? "";
        for (const event of events) {
          if (!event.startsWith("data: ")) continue;
          const part = JSON.parse(event.slice(6));
          if (part.type === "text") setText(previous => previous + part.text);
          if (part.type === "reasoning") setReasoning(previous => previous + part.text);
          if (part.type === "error") throw new Error(part.message);
        }
      }
    } catch (failure) {
      if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : "Não foi possível concluir a análise.");
    } finally { setBusy(false); abort.current = null; }
  }

  return (
    <section className="space-y-5 py-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold"><BrainCircuit className="text-primary" /> Análise do mês · OpenAI</h2>
        {busy ? <Button variant="outline" onClick={() => abort.current?.abort()}><Square /> Parar</Button> : <Button onClick={analyze} disabled={!data.count && !data.expenses}><BrainCircuit />{text ? "Atualizar análise" : "Analisar mês"}</Button>}
      </div>
      <p className="text-sm text-muted-foreground">{data.count} atendimentos · {data.services.length} serviços · {data.month.split("-").reverse().join("/")}</p>
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> Analisando os números…</p>}
      {error && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
      {reasoning && <details className="text-sm text-muted-foreground"><summary className="cursor-pointer">Raciocínio da análise</summary><p className="mt-3 whitespace-pre-wrap break-words">{reasoning}</p></details>}
      {text && <div aria-label="Resultado da análise" className="max-w-3xl whitespace-pre-wrap break-words text-base leading-relaxed">{text}</div>}
      {!text && !busy && !error && <p className="py-8 text-sm text-muted-foreground">{!data.count && !data.expenses ? "Nenhum registro neste mês." : "Análise ainda não gerada."}</p>}
      <p className="border-t border-border pt-4 text-xs text-muted-foreground">Somente totais e nomes de serviços são enviados à OpenAI; nomes de clientes e descrições de despesas não são enviados. Usa créditos de IA. Recomendações podem conter erros; confira antes de decidir.</p>
    </section>
  );
}