import { describe, expect, it } from "vitest";
import { analysisSchema, summarizeMonth } from "@/lib/barber-analysis";

describe("Monthly AI input", () => {
  it("excludes client identities and expense descriptions", () => {
    const visit = { date: "2026-10-23", serviceName: "Corte", price: 40, client: "Nome privado" };
    const expense = { date: "2026-10-23", amount: 10, title: "Descrição privada" };
    const data = summarizeMonth("2026-10", [visit], [expense]);
    expect(JSON.stringify(data)).not.toContain("Nome privado");
    expect(JSON.stringify(data)).not.toContain("Descrição privada");
    expect(data.revenue).toBe(40); expect(data.expenses).toBe(10);
  });
  it("compares January with December of the previous year", () => {
    const data = summarizeMonth("2026-01", [{ date: "2025-12-31", serviceName: "Corte", price: 40 }, { date: "2026-01-01", serviceName: "Barba", price: 30 }], []);
    expect(data.previous.revenue).toBe(40); expect(data.revenue).toBe(30);
  });
  it("rejects customer fields added to a request", () => {
    const data = summarizeMonth("2026-10", [], []);
    expect(analysisSchema.safeParse({ ...data, client: "Private" }).success).toBe(false);
  });
});