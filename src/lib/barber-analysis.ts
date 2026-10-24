import { z } from "zod";

const money = z.number().finite().min(0).max(1e12);
export const analysisSchema = z.object({
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  count: z.number().int().min(0).max(1e7),
  revenue: money,
  expenses: money,
  services: z.array(z.object({ name: z.string().trim().min(1).max(50), count: z.number().int().min(0), total: money }).strict()).max(500),
  previous: z.object({ count: z.number().int().min(0), revenue: money, expenses: money }).strict(),
}).strict();
export type AnalysisData = z.infer<typeof analysisSchema>;

export function summarizeMonth(month: string, visits: { date: string; serviceName: string; price: number }[], expenses: { date: string; amount: number }[]): AnalysisData {
  const [year, number] = month.split("-").map(Number);
  const previousMonth = new Date(Date.UTC(year, number - 2, 1)).toISOString().slice(0, 7);
  const current = visits.filter(v => v.date.startsWith(month));
  const previous = visits.filter(v => v.date.startsWith(previousMonth));
  const services = new Map<string, { name: string; count: number; total: number }>();
  for (const visit of current) {
    const row = services.get(visit.serviceName) ?? { name: visit.serviceName, count: 0, total: 0 };
    row.count += 1; row.total += visit.price; services.set(visit.serviceName, row);
  }
  const totalExpenses = (period: string) => expenses.filter(e => e.date.startsWith(period)).reduce((sum, e) => sum + e.amount, 0);
  return { month, count: current.length, revenue: current.reduce((sum, v) => sum + v.price, 0), expenses: totalExpenses(month), services: [...services.values()].sort((a, b) => b.total - a.total), previous: { count: previous.length, revenue: previous.reduce((sum, v) => sum + v.price, 0), expenses: totalExpenses(previousMonth) } };
}