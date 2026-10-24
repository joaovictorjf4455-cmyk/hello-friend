import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Plus, Scissors, Trash2, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MonthlyAnalysis } from "@/components/monthly-analysis";
import { summarizeMonth } from "@/lib/barber-analysis";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinanAI Barbeiro — Controle de cortes e serviços" },
      { name: "description", content: "Registre cortes e serviços da sua barbearia e acompanhe o faturamento do mês." },
      { property: "og:title", content: "FinanAI Barbeiro" },
      { property: "og:description", content: "Registre cortes e serviços da barbearia e veja seu faturamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500;600;700&display=swap" },
    ],
  }),
  component: Barbearia,
});

type Service = { id: string; name: string; price: number };
type Visit = { id: string; serviceId: string; serviceName: string; price: number; client: string; payment: string; date: string };
type Expense = { id: string; title: string; amount: number; date: string };

const defaultServices: Service[] = [
  { id: "s1", name: "Corte", price: 40 },
  { id: "s2", name: "Barba", price: 30 },
  { id: "s3", name: "Corte + Barba", price: 60 },
  { id: "s4", name: "Pezinho", price: 15 },
  { id: "s5", name: "Sobrancelha", price: 15 },
];
const payments = ["Pix", "Dinheiro", "Cartão"];
const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d: string) => d.split("-").reverse().join("/");

function usePersisted<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setValue(JSON.parse(raw)); } catch { /* ignore */ }
    setReady(true);
  }, [key]);
  useEffect(() => { if (ready) localStorage.setItem(key, JSON.stringify(value)); }, [key, value, ready]);
  return [value, setValue] as const;
}

const input = "mt-1 w-full rounded-md border border-input bg-background p-3 text-foreground";

function Barbearia() {
  const [services, setServices] = usePersisted<Service[]>("barber-services-v2", defaultServices);
  const [visits, setVisits] = usePersisted<Visit[]>("barber-visits-v2", []);
  const [expenses, setExpenses] = usePersisted<Expense[]>("barber-expenses-v2", []);
  const [tab, setTab] = useState<"servicos" | "catalogo" | "despesas" | "analise">("servicos");
  const [month, setMonth] = useState(today().slice(0, 7));

  const [serviceId, setServiceId] = useState("s1");
  const [client, setClient] = useState("");
  const [payment, setPayment] = useState("Pix");
  const [date, setDate] = useState(today);
  const [customPrice, setCustomPrice] = useState("");

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [expTitle, setExpTitle] = useState("");
  const [expAmount, setExpAmount] = useState("");

  const mVisits = useMemo(() => visits.filter(v => v.date.startsWith(month)).sort((a, b) => b.date.localeCompare(a.date)), [visits, month]);
  const mExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(month)), [expenses, month]);
  const revenue = mVisits.reduce((s, v) => s + v.price, 0);
  const spent = mExpenses.reduce((s, e) => s + e.amount, 0);
  const ranking = services.map(s => ({ ...s, count: mVisits.filter(v => v.serviceId === s.id).length, total: mVisits.filter(v => v.serviceId === s.id).reduce((a, v) => a + v.price, 0) })).filter(s => s.count).sort((a, b) => b.total - a.total);

  const selected = services.find(s => s.id === serviceId);

  const addVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const price = customPrice ? Number(customPrice) : selected.price;
    if (!Number.isFinite(price) || price < 0) return;
    setVisits(p => [{ id: crypto.randomUUID(), serviceId: selected.id, serviceName: selected.name, price, client: client.trim(), payment, date }, ...p]);
    setClient(""); setCustomPrice("");
  };
  const addService = (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(newPrice);
    if (!newName.trim() || !Number.isFinite(price) || price <= 0) return;
    setServices(p => [...p, { id: crypto.randomUUID(), name: newName.trim(), price }]);
    setNewName(""); setNewPrice("");
  };
  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expAmount);
    if (!expTitle.trim() || !Number.isFinite(amount) || amount <= 0) return;
    setExpenses(p => [{ id: crypto.randomUUID(), title: expTitle.trim(), amount, date: today() }, ...p]);
    setExpTitle(""); setExpAmount("");
  };

  const tabs = [
    { id: "servicos", label: "Atendimentos" },
    { id: "catalogo", label: "Tabela de preços" },
    { id: "despesas", label: "Despesas" },
    { id: "analise", label: "Análise IA" },
  ] as const;

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "Barlow, sans-serif" }}>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-primary p-2 text-primary-foreground"><Scissors size={24} /></div>
            <div>
              <h1 className="text-3xl leading-none tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>FinanAI <span className="text-primary">Barbeiro</span></h1>
              <p className="text-xs text-muted-foreground">Cortes, serviços e caixa do mês</p>
            </div>
          </div>
          <input aria-label="Mês" type="month" value={month} onChange={e => setMonth(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Faturamento", value: brl(revenue), icon: TrendingUp, cls: "text-primary" },
            { label: "Atendimentos", value: String(mVisits.length), icon: Scissors, cls: "text-foreground" },
            { label: "Lucro (fat. − despesas)", value: brl(revenue - spent), icon: Wallet, cls: revenue - spent >= 0 ? "text-primary" : "text-destructive" },
          ].map(c => (
            <div key={c.label} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">{c.label}<c.icon size={18} /></div>
              <div className={`text-4xl tracking-wide ${c.cls}`} style={{ fontFamily: "'Bebas Neue', sans-serif" }}>{c.value}</div>
            </div>
          ))}
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto">
          {tabs.map(t => (
            <Button key={t.id} onClick={() => setTab(t.id)} variant={tab === t.id ? "default" : "secondary"}>{t.label}</Button>
          ))}
        </nav>

        {tab === "servicos" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <form onSubmit={addVisit} className="h-fit space-y-4 rounded-lg border border-border bg-card p-5">
              <h2 className="text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Registrar atendimento</h2>
              <div className="grid grid-cols-2 gap-2">
                {services.map(s => (
                  <button type="button" key={s.id} onClick={() => setServiceId(s.id)} className={`rounded-md border p-3 text-left text-sm transition ${serviceId === s.id ? "border-primary bg-primary/15" : "border-border hover:bg-accent"}`}>
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-muted-foreground">{brl(s.price)}</div>
                  </button>
                ))}
              </div>
              <label className="block text-sm">Cliente (opcional)<input maxLength={80} value={client} onChange={e => setClient(e.target.value)} placeholder="Ex.: Carlos" className={input} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-sm">Valor cobrado<input type="number" min="0" step="0.01" value={customPrice} onChange={e => setCustomPrice(e.target.value)} placeholder={selected ? String(selected.price) : ""} className={input} /></label>
                <label className="block text-sm">Pagamento<select value={payment} onChange={e => setPayment(e.target.value)} className={input}>{payments.map(p => <option key={p}>{p}</option>)}</select></label>
              </div>
              <label className="block text-sm">Data<input required type="date" value={date} onChange={e => setDate(e.target.value)} className={input} /></label>
              <button className="flex w-full items-center justify-center gap-2 rounded-md bg-primary p-3 font-bold text-primary-foreground hover:opacity-90"><Plus size={18} /> Registrar</button>
            </form>

            <div className="space-y-5">
              <section className="rounded-lg border border-border bg-card p-5">
                <h2 className="mb-4 text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Atendimentos de {fmtDate(month)}</h2>
                {mVisits.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhum atendimento neste mês.</p> : (
                  <div className="divide-y divide-border">
                    {mVisits.map(v => (
                      <div key={v.id} className="flex items-center gap-3 py-3">
                        <div className="rounded-md bg-primary/15 p-2 text-primary"><Scissors size={16} /></div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{v.serviceName}{v.client && ` — ${v.client}`}</p>
                          <p className="text-xs text-muted-foreground">{fmtDate(v.date)} • {v.payment}</p>
                        </div>
                        <strong className="text-sm text-primary">{brl(v.price)}</strong>
                        <button aria-label="Excluir atendimento" onClick={() => setVisits(p => p.filter(x => x.id !== v.id))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
              {ranking.length > 0 && (
                <section className="rounded-lg border border-border bg-card p-5">
                  <h2 className="mb-4 text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Serviços mais vendidos</h2>
                  <div className="space-y-4">
                    {ranking.map(r => (
                      <div key={r.id}>
                        <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{r.name} <span className="text-muted-foreground">({r.count}x)</span></span><span>{brl(r.total)}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${(r.total / revenue) * 100}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}

        {tab === "catalogo" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <form onSubmit={addService} className="h-fit space-y-4 rounded-lg border border-border bg-card p-5">
              <h2 className="text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Novo serviço</h2>
              <label className="block text-sm">Nome<input required maxLength={50} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex.: Platinado" className={input} /></label>
              <label className="block text-sm">Preço (R$)<input required type="number" min="0.01" step="0.01" value={newPrice} onChange={e => setNewPrice(e.target.value)} className={input} /></label>
              <button className="rounded-md bg-primary px-5 py-3 font-bold text-primary-foreground">Adicionar serviço</button>
            </form>
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Tabela de preços</h2>
              <div className="divide-y divide-border">
                {services.map(s => (
                  <div key={s.id} className="flex items-center gap-3 py-3">
                    <span className="flex-1 font-semibold">{s.name}</span>
                    <input aria-label={`Preço de ${s.name}`} type="number" min="0" step="0.01" value={s.price} onChange={e => setServices(p => p.map(x => x.id === s.id ? { ...x, price: Number(e.target.value) || 0 } : x))} className="w-28 rounded-md border border-input bg-background p-2 text-right text-sm" />
                    <button aria-label={`Excluir ${s.name}`} onClick={() => setServices(p => p.filter(x => x.id !== s.id))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === "despesas" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <form onSubmit={addExpense} className="h-fit space-y-4 rounded-lg border border-border bg-card p-5">
              <h2 className="text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Nova despesa</h2>
              <label className="block text-sm">Descrição<input required maxLength={80} value={expTitle} onChange={e => setExpTitle(e.target.value)} placeholder="Ex.: Lâminas, aluguel" className={input} /></label>
              <label className="block text-sm">Valor (R$)<input required type="number" min="0.01" step="0.01" value={expAmount} onChange={e => setExpAmount(e.target.value)} className={input} /></label>
              <button className="rounded-md bg-primary px-5 py-3 font-bold text-primary-foreground">Adicionar despesa</button>
            </form>
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-4 text-2xl tracking-wide" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>Despesas do mês — {brl(spent)}</h2>
              {mExpenses.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma despesa neste mês.</p> : (
                <div className="divide-y divide-border">
                  {mExpenses.map(x => (
                    <div key={x.id} className="flex items-center gap-3 py-3">
                      <div className="rounded-md bg-destructive/15 p-2 text-destructive"><ArrowUpRight size={16} /></div>
                      <div className="flex-1"><p className="text-sm font-semibold">{x.title}</p><p className="text-xs text-muted-foreground">{fmtDate(x.date)}</p></div>
                      <strong className="text-sm text-destructive">− {brl(x.amount)}</strong>
                      <button aria-label="Excluir despesa" onClick={() => setExpenses(p => p.filter(e => e.id !== x.id))} className="p-1 text-muted-foreground hover:text-destructive"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {tab === "analise" && <MonthlyAnalysis key={JSON.stringify(summarizeMonth(month, visits, expenses))} data={summarizeMonth(month, visits, expenses)} />}
        <p className="mt-8 text-center text-xs text-muted-foreground">Os dados ficam salvos somente neste navegador.</p>
      </main>
    </div>
  );
}
