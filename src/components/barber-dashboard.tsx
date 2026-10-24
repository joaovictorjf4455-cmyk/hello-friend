import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Scissors, Trash2 } from "lucide-react";

type Booking = { id: string; client: string; service: string; price: number; when: string; status: "scheduled" | "done" | "cancelled" };
const KEY = "finanai-barber-bookings-v1";
const SERVICES = [{ name: "Corte", price: 35 }, { name: "Barba", price: 25 }, { name: "Corte + barba", price: 55 }, { name: "Sobrancelha", price: 15 }];
const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
const getBookings = (): Booking[] => {
  if (typeof window === "undefined") return [];
  try { const value = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(value) ? value : []; } catch { return []; }
};
export function BarberDashboard({ month }: { month: string }) {
  const [bookings, setBookings] = useState<Booking[]>(getBookings);
  const [client, setClient] = useState("");
  const [service, setService] = useState(SERVICES[0].name);
  const [price, setPrice] = useState(String(SERVICES[0].price));
  const [when, setWhen] = useState("");
  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(bookings)); }, [bookings]);
  const filtered = useMemo(() => bookings.filter(b => b.when.startsWith(month)).sort((a, b) => a.when.localeCompare(b.when)), [bookings, month]);
  const completed = filtered.filter(b => b.status === "done");
  const revenue = completed.reduce((sum, b) => sum + b.price, 0);
  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(price);
    if (!client.trim() || !when || !Number.isFinite(amount) || amount < 0) return;
    const conflict = bookings.some(b => b.when === when && b.status === "scheduled");
    if (conflict && !window.confirm("Já existe um atendimento agendado neste horário. Deseja continuar?")) return;
    setBookings(prev => [...prev, { id: crypto.randomUUID(), client: client.trim(), service, price: amount, when, status: "scheduled" }]);
    setClient(""); setWhen("");
  };
  const changeStatus = (id: string, status: Booking["status"]) => setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <Summary label="Faturamento do mês" value={money(revenue)} />
      <Summary label="Atendimentos realizados" value={String(completed.length)} />
      <Summary label="Agendamentos pendentes" value={String(filtered.filter(b => b.status === "scheduled").length)} />
    </div>
    <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Área de uso pessoal: os agendamentos são registrados manualmente e ficam somente neste navegador. Não envia lembretes aos clientes.</p>
    <div className="grid gap-5 lg:grid-cols-[0.9fr_1.2fr]">
      <form onSubmit={create} className="h-fit space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 font-bold"><Scissors size={19}/> Agendar cliente</h2>
        <label className="block text-sm">Nome do cliente<input required maxLength={100} value={client} onChange={e => setClient(e.target.value)} placeholder="Nome ou apelido" className="mt-1 w-full rounded-xl border p-3"/></label>
        <label className="block text-sm">Serviço<select value={service} onChange={e => { setService(e.target.value); setPrice(String(SERVICES.find(s => s.name === e.target.value)?.price ?? 0)); }} className="mt-1 w-full rounded-xl border p-3">{SERVICES.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}</select></label>
        <label className="block text-sm">Preço (R$)<input required type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label>
        <label className="block text-sm">Dia e horário<input required type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/></label>
        <button className="w-full rounded-xl bg-emerald-500 p-3 font-bold text-slate-950">Salvar agendamento</button>
        <p className="text-xs text-slate-500">Os preços são sugestões e podem ser alterados em cada atendimento.</p>
      </form>
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-bold"><CalendarDays size={19}/> Agenda do mês</h2>
        {filtered.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">Nenhum atendimento neste mês.</p> : <div className="divide-y">{filtered.map(b => <div key={b.id} className="space-y-2 py-4">
          <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{b.client}</p><p className="text-sm text-slate-500">{b.service} · {new Date(b.when + ":00").toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p></div><strong className="whitespace-nowrap text-sm">{money(b.price)}</strong></div>
          <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-medium ${b.status === "done" ? "bg-emerald-100 text-emerald-700" : b.status === "cancelled" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{b.status === "done" ? "Realizado" : b.status === "cancelled" ? "Cancelado" : "Agendado"}</span>
          {b.status === "scheduled" && <><button onClick={() => changeStatus(b.id, "done")} className="flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs text-emerald-800"><CheckCircle2 size={14}/> Concluir</button><button onClick={() => changeStatus(b.id, "cancelled")} className="rounded-lg bg-slate-100 px-2 py-1 text-xs">Cancelar</button></>}
          <button aria-label={`Excluir atendimento de ${b.client}`} onClick={() => { if (window.confirm("Excluir este atendimento?")) setBookings(prev => prev.filter(x => x.id !== b.id)); }} className="ml-auto p-1 text-slate-400 hover:text-rose-600"><Trash2 size={16}/></button></div>
        </div>)}</div>}
      </section>
    </div>
    <p className="text-xs text-slate-500">O faturamento da barbearia é calculado apenas pelos atendimentos concluídos e não é somado automaticamente às finanças pessoais.</p>
  </div>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="mb-3 text-sm text-slate-500">{label}</p><p className="text-2xl font-bold">{value}</p></div>; }
