import { BarberDashboard } from "../components/barber-dashboard";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, BarChart3, CreditCard, LayoutDashboard, Plus, Target, Trash2, Wallet, Scissors, Download, Upload } from "lucide-react";

export const Route = createFileRoute("/")({ component: FinanAI });
type Transaction = { id: string; title: string; amount: number; kind: "income" | "expense"; category: string; date: string };
type Goal = { id: string; name: string; target: number; saved: number };
const initialTransactions: Transaction[] = [
  { id: "demo-1", title: "Salário", amount: 5200, kind: "income", category: "Trabalho", date: "2026-10-05" },
  { id: "demo-2", title: "Aluguel", amount: 1250, kind: "expense", category: "Moradia", date: "2026-10-06" },
  { id: "demo-3", title: "Supermercado", amount: 480, kind: "expense", category: "Alimentação", date: "2026-10-09" },
  { id: "demo-4", title: "Transporte", amount: 180, kind: "expense", category: "Transporte", date: "2026-10-10" },
];
const initialGoals: Goal[] = [{ id: "goal-demo", name: "Reserva de emergência", target: 10000, saved: 2400 }];
const currency = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const categories = ["Alimentação", "Moradia", "Transporte", "Saúde", "Lazer", "Compras", "Trabalho", "Outros"];
const today = () => new Date().toISOString().slice(0, 10);
function readSaved<T,>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = window.localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function FinanAI() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => readSaved("finanai-transactions-v1", initialTransactions));
  const [goals, setGoals] = useState<Goal[]>(() => readSaved("finanai-goals-v1", initialGoals));
  const [tab, setTab] = useState<"overview" | "transactions" | "reports" | "goals" | "barber">("overview");
  const [modal, setModal] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Alimentação");
  const [date, setDate] = useState(today);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDeposit, setGoalDeposit] = useState<Record<string, string>>({});
  const [month, setMonth] = useState(today().slice(0, 7));
  useEffect(() => { window.localStorage.setItem("finanai-transactions-v1", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { window.localStorage.setItem("finanai-goals-v1", JSON.stringify(goals)); }, [goals]);
  const monthly = useMemo(() => transactions.filter(t => t.date.startsWith(month)), [transactions, month]);
  const income = monthly.filter(t => t.kind === "income").reduce((sum, t) => sum + t.amount, 0);
  const expenses = monthly.filter(t => t.kind === "expense").reduce((sum, t) => sum + t.amount, 0);
  const breakdown = categories.map(name => ({ name, value: monthly.filter(t => t.kind === "expense" && t.category === name).reduce((s, t) => s + t.amount, 0) })).filter(c => c.value > 0).sort((a,b) => b.value - a.value);
  const ordered = [...monthly].sort((a,b) => b.date.localeCompare(a.date));
  const addTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);
    if (!title.trim() || !Number.isFinite(value) || value <= 0 || !date) return;
    setTransactions(prev => [{ id: crypto.randomUUID(), title: title.trim(), amount: value, kind, category: kind === "income" ? "Trabalho" : category, date }, ...prev]);
    setTitle(""); setAmount(""); setModal(false);
  };
  const addGoal = (e: React.FormEvent) => {
    e.preventDefault(); const value = Number(goalTarget);
    if (!goalName.trim() || !Number.isFinite(value) || value <= 0) return;
    setGoals(prev => [...prev, { id: crypto.randomUUID(), name: goalName.trim(), target: value, saved: 0 }]); setGoalName(""); setGoalTarget("");
  };
  const deposit = (id: string) => {
    const value = Number(goalDeposit[id]);
    if (!Number.isFinite(value) || value <= 0) return;
    setGoals(prev => prev.map(g => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + value) } : g));
    setGoalDeposit(prev => ({ ...prev, [id]: "" }));
  };
  const navigation = [
    { id: "overview", label: "Visão geral", icon: LayoutDashboard },
    { id: "transactions", label: "Transações", icon: CreditCard },
    { id: "reports", label: "Relatórios", icon: BarChart3 },
    { id: "goals", label: "Metas", icon: Target },
    { id: "barber", label: "Minha Barbearia", icon: Scissors },
  ] as const;
  const exportBackup = () => {
    const backup = { format: "finanai-backup", version: 1, exportedAt: new Date().toISOString(), transactions, goals, cashEntries: readSaved("finanai-barber-cash-v1", []) };
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = "finanai-backup.json"; link.click(); URL.revokeObjectURL(url);
  };
  const importBackup = async (file?: File) => {
    if (!file || file.size > 2_000_000) { window.alert("Selecione um arquivo JSON de até 2 MB."); return; }
    try {
      const data: unknown = JSON.parse(await file.text());
      if (!data || typeof data !== "object") throw Error("Formato inválido");
      const b = data as Record<string, unknown>;
      if (b.format !== "finanai-backup" || b.version !== 1 || !Array.isArray(b.transactions) || !Array.isArray(b.goals) || !Array.isArray(b.cashEntries)) throw Error("Backup incompatível");
      const validTx = b.transactions.every((t: unknown) => !!t && typeof t === "object" && typeof (t as Transaction).id === "string" && typeof (t as Transaction).title === "string" && typeof (t as Transaction).amount === "number" && Number.isFinite((t as Transaction).amount) && ["income", "expense"].includes((t as Transaction).kind) && typeof (t as Transaction).date === "string" && typeof (t as Transaction).category === "string");
      const validGoals = b.goals.every((g: unknown) => !!g && typeof g === "object" && typeof (g as Goal).id === "string" && typeof (g as Goal).name === "string" && Number.isFinite((g as Goal).target) && Number.isFinite((g as Goal).saved));
      const validCash = b.cashEntries.every((x: unknown) => !!x && typeof x === "object" && typeof (x as { id: string }).id === "string" && typeof (x as { description: string }).description === "string" && Number.isFinite((x as { amount: number }).amount) && (x as { amount: number }).amount > 0 && typeof (x as { date: string }).date === "string" && ["in", "out"].includes((x as { type: string }).type));
      if (!validTx || !validGoals || !validCash) throw Error("Dados inválidos");
      if (!window.confirm("Importar backup? Os dados atuais serão substituídos.")) return;
      localStorage.setItem("finanai-barber-cash-v1", JSON.stringify(b.cashEntries));
      setTransactions(b.transactions as Transaction[]); setGoals(b.goals as Goal[]);
      window.alert("Backup importado. A página será recarregada."); window.location.reload();
    } catch { window.alert("Não foi possível importar o backup. Verifique o arquivo."); }
  };
  return <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <div className="mx-auto flex min-h-screen max-w-[1500px] flex-col md:flex-row">
      <aside className="bg-[#101c31] px-5 py-6 text-white md:min-h-screen md:w-64 md:shrink-0">
        <div className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-emerald-400 p-2 text-slate-900"><Wallet size={23}/></div><div><div className="text-xl font-bold">Finan<span className="text-emerald-400">AI</span></div><div className="text-xs text-slate-400">Seu dinheiro sob controle</div></div></div>
        <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-1">{navigation.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-left text-sm transition ${tab === item.id ? "bg-emerald-400 font-semibold text-slate-950" : "text-slate-300 hover:bg-white/10"}`}><item.icon size={18}/>{item.label}</button>)}</nav>
        <p className="mt-8 hidden text-xs leading-relaxed text-slate-400 md:block">Versão demonstrativa. Seus registros ficam somente neste navegador, sem sincronização ou backup.</p>
      </aside>
      <main className="w-full min-w-0 flex-1 px-4 py-7 sm:px-8">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-medium text-emerald-700">Painel financeiro pessoal</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">{navigation.find(n => n.id === tab)?.label}</h1></div><div className="flex flex-wrap items-center gap-2"><input aria-label="Mês de referência" type="month" value={month} onChange={e => setMonth(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"/><button onClick={() => setModal(true)} className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-emerald-400"><Plus size={18}/> Nova transação</button></div></header>
        {(tab === "overview" || tab === "reports") && <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[{ label: "Saldo do mês", value: income - expenses, icon: Wallet, color: "text-slate-900" }, { label: "Receitas", value: income, icon: ArrowDownLeft, color: "text-emerald-600" }, { label: "Despesas", value: expenses, icon: ArrowUpRight, color: "text-rose-600" }].map(card => <div key={card.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between text-sm text-slate-500">{card.label}<card.icon size={20}/></div><div className={`text-2xl font-bold ${card.color}`}>{currency(card.value)}</div></div>)}
        </div>}
        {tab === "overview" && <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
          <section className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-5 flex items-center justify-between"><h2 className="font-bold">Últimas transações</h2><button onClick={() => setTab("transactions")} className="text-sm font-semibold text-emerald-700">Ver todas</button></div><TransactionList items={ordered.slice(0, 6)} onDelete={id => setTransactions(prev => prev.filter(t => t.id !== id))}/></section>
          <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-5 font-bold">Onde você gastou</h2><Breakdown items={breakdown} total={expenses}/><div className="mt-8 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">💡 Dica: acompanhe suas maiores categorias de gastos para identificar oportunidades de economia.</div></section>
        </div>}
        {tab === "transactions" && <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-5 font-bold">Movimentações de {month.split("-").reverse().join("/")}</h2><TransactionList items={ordered} onDelete={id => setTransactions(prev => prev.filter(t => t.id !== id))}/></section>}
        {tab === "reports" && <section className="rounded-2xl bg-white p-5 shadow-sm"><h2 className="mb-5 font-bold">Despesas por categoria</h2><Breakdown items={breakdown} total={expenses}/></section>}
        {tab === "barber" && <BarberDashboard month={month}/>}
        {tab === "goals" && <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]"><form onSubmit={addGoal} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm"><h2 className="font-bold">Criar nova meta</h2><label className="block text-sm">Nome da meta<input required value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="Ex.: Minha viagem" className="mt-1 w-full rounded-xl border p-3"/></label><label className="block text-sm">Valor desejado (R$)<input required type="number" min="0.01" step="0.01" value={goalTarget} onChange={e => setGoalTarget(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label><button className="rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950">Criar meta</button></form><section className="space-y-4">{goals.map(g => <div key={g.id} className="rounded-2xl bg-white p-5 shadow-sm"><div className="mb-2 flex items-center justify-between gap-2"><h3 className="font-bold">{g.name}</h3><button aria-label={`Excluir meta ${g.name}`} onClick={() => setGoals(prev => prev.filter(item => item.id !== g.id))} className="text-slate-400 hover:text-rose-600"><Trash2 size={18}/></button></div><p className="mb-3 text-sm text-slate-500">{currency(g.saved)} de {currency(g.target)}</p><div className="mb-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.min(100, g.saved / g.target * 100)}%` }}/></div><div className="flex gap-2"><input aria-label={`Adicionar à meta ${g.name}`} type="number" min="0.01" step="0.01" placeholder="Valor para guardar" value={goalDeposit[g.id] ?? ""} onChange={e => setGoalDeposit(prev => ({ ...prev, [g.id]: e.target.value }))} className="min-w-0 flex-1 rounded-xl border p-2 text-sm"/><button onClick={() => deposit(g.id)} className="rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">Adicionar</button></div></div>)}{goals.length === 0 && <p className="text-slate-500">Você ainda não criou metas.</p>}</section></div>}
        <section className="mt-7 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"><div className="mr-auto"><p className="font-semibold">Backup gratuito</p><p className="text-xs text-slate-500">Salve um arquivo no seu dispositivo para proteger seus registros.</p></div><button onClick={exportBackup} className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm text-white"><Download size={16}/> Exportar</button><label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Upload size={16}/> Importar<input type="file" accept=".json,application/json" className="hidden" onChange={e => { void importBackup(e.target.files?.[0]); e.target.value = ""; }}/></label></section>
        <p className="mt-8 text-center text-xs text-slate-500">FinanAI MVP • Dados demonstrativos armazenados localmente • Não conecte contas bancárias nesta versão.</p>
      </main>
    </div>
    {modal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" onClick={() => setModal(false)}><form onClick={e => e.stopPropagation()} onSubmit={addTransaction} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Nova transação</h2><button type="button" onClick={() => setModal(false)} aria-label="Fechar">✕</button></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setKind("expense")} className={`rounded-xl p-3 text-sm font-semibold ${kind === "expense" ? "bg-rose-100 text-rose-700" : "bg-slate-100"}`}>Despesa</button><button type="button" onClick={() => setKind("income")} className={`rounded-xl p-3 text-sm font-semibold ${kind === "income" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100"}`}>Receita</button></div><label className="block text-sm">Descrição<input required maxLength={100} value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex.: Supermercado" className="mt-1 w-full rounded-xl border p-3"/></label><label className="block text-sm">Valor (R$)<input required type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label>{kind === "expense" && <label className="block text-sm">Categoria<select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full rounded-xl border p-3">{categories.map(c => <option key={c}>{c}</option>)}</select></label>}<label className="block text-sm">Data<input required type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label><button className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-slate-950">Salvar transação</button></form></div>}
  </div>;
}
function TransactionList({ items, onDelete }: { items: Transaction[]; onDelete: (id: string) => void }) {
  if (!items.length) return <p className="py-8 text-center text-sm text-slate-500">Nenhuma transação neste mês.</p>;
  return <div className="divide-y divide-slate-100">{items.map(t => <div key={t.id} className="flex items-center gap-3 py-3"><div className={`rounded-xl p-2.5 ${t.kind === "income" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-600"}`}>{t.kind === "income" ? <ArrowDownLeft size={19}/> : <ArrowUpRight size={19}/>}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{t.title}</p><p className="text-xs text-slate-500">{t.category} • {t.date.split("-").reverse().join("/")}</p></div><strong className={`whitespace-nowrap text-sm ${t.kind === "income" ? "text-emerald-700" : "text-rose-600"}`}>{t.kind === "income" ? "+" : "−"} {currency(t.amount)}</strong><button onClick={() => onDelete(t.id)} aria-label={`Excluir ${t.title}`} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button></div>)}</div>;
}
function Breakdown({ items, total }: { items: { name: string; value: number }[]; total: number }) {
  if (!items.length) return <p className="py-8 text-sm text-slate-500">Cadastre despesas para visualizar seu relatório.</p>;
  return <div className="space-y-5">{items.map(item => <div key={item.name}><div className="mb-2 flex justify-between gap-2 text-sm"><span className="font-medium">{item.name}</span><span className="text-slate-500">{currency(item.value)} ({Math.round(item.value / total * 100)}%)</span></div><div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${item.value / total * 100}%` }}/></div></div>)}</div>;
}
