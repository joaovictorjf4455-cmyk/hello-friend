import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";

type CashEntry = { id: string; type: "in" | "out"; amount: number; description: string; date: string };
const KEY = "finanai-barber-cash-v1";
const currency = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const localToday = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-"); };
function readEntries(): CashEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const data: unknown = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(data) ? data.filter((x): x is CashEntry => !!x && typeof x === "object" && ["in", "out"].includes(x.type) && typeof x.id === "string" && typeof x.description === "string" && typeof x.amount === "number" && Number.isFinite(x.amount) && x.amount > 0 && typeof x.date === "string") : [];
  } catch { return []; }
}
export function BarberDashboard({ month }: { month: string }) {
  const [entries, setEntries] = useState<CashEntry[]>(readEntries);
  const [type, setType] = useState<"in" | "out">("in");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(localToday);
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(entries)); }, [entries]);
  const monthly = useMemo(() => entries.filter(e => e.date.startsWith(month)).sort((a,b) => b.date.localeCompare(a.date)), [entries, month]);
  const incoming = monthly.filter(e => e.type === "in").reduce((s,e) => s + e.amount, 0);
  const outgoing = monthly.filter(e => e.type === "out").reduce((s,e) => s + e.amount, 0);
  const daily = monthly.filter(e => e.date === localToday());
  const dailyIn = daily.filter(e => e.type === "in").reduce((s,e) => s + e.amount, 0);
  const dailyOut = daily.filter(e => e.type === "out").reduce((s,e) => s + e.amount, 0);
  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0 || !date) return;
    setEntries(prev => [{ id: crypto.randomUUID(), type, amount: value, description: description.trim() || (type === "in" ? "Pagamento recebido" : "Despesa da barbearia"), date }, ...prev]);
    setAmount(""); setDescription("");
  };
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <Summary label="Entradas do mês" value={currency(incoming)} color="text-emerald-700"/>
      <Summary label="Saídas do mês" value={currency(outgoing)} color="text-rose-600"/>
      <Summary label="Sobrou no mês" value={currency(incoming - outgoing)} color="text-slate-900"/>
    </div>
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Hoje:</strong> entrou {currency(dailyIn)} · saiu {currency(dailyOut)} · sobrou <strong>{currency(dailyIn - dailyOut)}</strong></div>
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.2fr]">
      <form onSubmit={add} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">Registrar dinheiro</h2>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setType("in")} className={`flex items-center justify-center gap-2 rounded-xl p-3 font-semibold ${type === "in" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}><ArrowDownLeft size={18}/> Entrada</button>
          <button type="button" onClick={() => setType("out")} className={`flex items-center justify-center gap-2 rounded-xl p-3 font-semibold ${type === "out" ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-600"}`}><ArrowUpRight size={18}/> Saída</button>
        </div>
        <label className="block text-sm">Valor (R$)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Ex.: 35,00" className="mt-1 w-full rounded-xl border p-3"/></label>
        <label className="block text-sm">Descrição (opcional)<input maxLength={120} value={description} onChange={e => setDescription(e.target.value)} placeholder={type === "in" ? "Ex.: Corte de cabelo" : "Ex.: Lâminas"} className="mt-1 w-full rounded-xl border p-3"/></label>
        <label className="block text-sm">Data<input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label>
        <button className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-slate-950">Salvar {type === "in" ? "entrada" : "saída"}</button>
      </form>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Movimentações do mês</h2>
        {!monthly.length ? <p className="py-8 text-center text-sm text-slate-500">Nenhuma entrada ou saída registrada neste mês.</p> : <div className="divide-y divide-slate-100">{monthly.map(entry => <div key={entry.id} className="flex items-center gap-3 py-3">
          <span className={`rounded-xl p-2 ${entry.type === "in" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>{entry.type === "in" ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{entry.description}</p><p className="text-xs text-slate-500">{entry.date.split("-").reverse().join("/")}</p></div>
          <strong className={`whitespace-nowrap text-sm ${entry.type === "in" ? "text-emerald-700" : "text-rose-600"}`}>{entry.type === "in" ? "+" : "−"} {currency(entry.amount)}</strong>
          <button aria-label={`Excluir ${entry.description}`} onClick={() => { if (window.confirm("Excluir este lançamento?")) setEntries(prev => prev.filter(x => x.id !== entry.id)); }} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button>
        </div>)}</div>}
      </section>
    </div>
    <p className="text-xs text-slate-500">Caixa da barbearia separado das finanças pessoais. Os valores ficam salvos neste navegador; use o backup para guardar uma cópia.</p>
  </div>;
}
function Summary({ label, value, color }: { label: string; value: string; color: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="mb-3 text-sm text-slate-500">{label}</p><p className={`text-2xl font-bold ${color}`}>{value}</p></div>; }
