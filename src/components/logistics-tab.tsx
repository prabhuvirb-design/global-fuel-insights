import { useMemo } from "react";
import { Truck, Fuel } from "lucide-react";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PaginatedTable } from "@/components/paginated-table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cheapestRefueling, countryPrices, priceForecast, volatilityRisk } from "@/lib/logistics";
import { type Row } from "@/lib/fuel-data";

const usd = (value: number) => `$${value.toFixed(2)}`;
const riskClasses = { "High Volatility": "border-risk-high/40 bg-risk-high/15 text-risk-high", Moderate: "border-risk-moderate/40 bg-risk-moderate/15 text-risk-moderate", Stable: "border-risk-stable/40 bg-risk-stable/15 text-risk-stable" };

export function LogisticsTab({ rows, trendRows, fuel, year, capacity, setCapacity }: { rows: Row[]; trendRows: Row[]; fuel: string; year: string; capacity: string; setCapacity: (value: string) => void }) {
  const liters = Number(capacity);
  const valid = capacity.trim() !== "" && Number.isFinite(liters) && liters > 0;
  const cheapest = useMemo(() => cheapestRefueling(rows, liters), [rows, liters]);
  const matrix = useMemo(() => countryPrices(rows), [rows]);
  const forecast = useMemo(() => priceForecast(trendRows), [trendRows]);
  const projected = forecast.find((point) => point.year === 2027);

  return <div className="space-y-8">
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-base font-semibold"><Truck className="h-5 w-5 text-primary" />Fleet Refueling Cost Calculator</h2>
      <div className="mt-5 grid gap-6 lg:grid-cols-[220px_1fr]">
        <div><label htmlFor="tank-capacity" className="text-sm text-muted-foreground">Fuel tank capacity (liters)</label><Input id="tank-capacity" type="number" inputMode="decimal" min="0.01" step="any" value={capacity} onChange={(event) => setCapacity(event.target.value)} aria-invalid={!valid} aria-describedby={!valid ? "capacity-error" : undefined} className="mt-2 h-11 font-mono text-lg" />
          {!valid && <p id="capacity-error" role="alert" className="mt-2 text-xs text-risk-high">Enter a capacity greater than zero.</p>}
          <p className="mt-3 text-xs text-muted-foreground">{fuel === "All" ? "All fuels · average price" : fuel} · {year === "All" ? "All years · average price" : year} · USD</p>
        </div>
        <ol aria-label="Cheapest refueling countries" className="grid gap-5 sm:grid-cols-3">
          {valid && cheapest.map((country, index) => <li key={country.country} className="min-w-0 border-l-2 border-primary/40 pl-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Fuel className="h-3.5 w-3.5" />#{index + 1} cheapest</div><h3 className="mt-2 break-words text-base font-medium">{country.country}</h3><p className="mt-1 font-mono text-xs text-muted-foreground">${country.price.toFixed(3)} / L</p><p className="mt-3 font-mono text-2xl font-semibold text-primary" data-testid="full-tank-cost">{usd(country.total)}</p><p className="mt-1 text-xs text-muted-foreground">Full tank · {liters.toLocaleString()} L</p></li>)}
          {!valid && <li className="self-center text-sm text-muted-foreground sm:col-span-3">Full-tank costs unavailable.</li>}
          {valid && !cheapest.length && <li className="self-center text-sm text-muted-foreground sm:col-span-3">No countries match the selected filters.</li>}
        </ol>
      </div>
    </section>

    <section className="border-b border-border pb-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-sm font-semibold">Historical fuel prices & 2027 forecast</h2><p className="mt-1 text-xs text-muted-foreground">2020–2026 average retail · USD/L · Selected fuel, region and income</p></div>{projected && <div className="text-right"><p className="text-xs text-muted-foreground">2027 indicative price</p><p className="font-mono text-xl text-chart-2">{usd(projected.forecast ?? 0)}</p></div>}</div>
      {forecast.length ? <ResponsiveContainer width="100%" height={320}><ComposedChart data={forecast} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(value) => usd(value)} />
        <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 }} formatter={(value: number | [number, number]) => Array.isArray(value) ? `${usd(value[0])}–${usd(value[1])}` : usd(value)} labelFormatter={(value) => `${value}${Number(value) === 2027 ? " · Forecast" : ""}`} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        <Area dataKey="band" name="Forecast range" stroke="none" fill="var(--chart-2)" fillOpacity={0.2} isAnimationActive={false} />
        <Line dataKey="historical" name="Historical retail price" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
        <Line dataKey="forecast" name="2027 projection" stroke="var(--chart-2)" strokeWidth={2.5} strokeDasharray="5 4" dot={{ r: 3 }} isAnimationActive={false} />
      </ComposedChart></ResponsiveContainer> : <div className="grid h-60 place-items-center text-sm text-muted-foreground">No historical data for this filter combination.</div>}
      <p className="mt-3 text-xs text-muted-foreground">Illustrative forecast from sample data, not a market prediction. 2024–2026 linear trend; shaded range reflects historical annual price changes, with a minimum ±10% spread.</p>
    </section>

    <section>
      <h2 className="text-sm font-semibold">Price Volatility Matrix</h2><p className="mt-1 mb-4 text-xs text-muted-foreground">Volatility index: Stable &lt;35 · Moderate 35–&lt;60 · High ≥60 · Retail prices in USD/L</p>
      <PaginatedTable items={matrix}>{(pageRows) => <table aria-label="Price Volatility Matrix" className="w-full text-left text-sm"><thead className="sticky top-0 z-10 bg-background text-xs text-muted-foreground"><tr>{["Country", "Region", "Retail price", "Volatility", "Risk"].map((heading) => <th key={heading} className="border-b border-border px-3 py-3 font-medium">{heading}</th>)}</tr></thead><tbody>{pageRows.map((country) => <tr key={country.country} className="border-b border-border/60 hover:bg-muted/50"><td className="px-3 py-3 font-medium">{country.country}</td><td className="px-3 py-3 text-muted-foreground">{country.region}</td><td className="px-3 py-3 font-mono">${country.price.toFixed(3)}</td><td className="px-3 py-3 font-mono">{country.volatility.toFixed(1)}</td><td className="px-3 py-3"><Badge variant="outline" className={`whitespace-nowrap ${riskClasses[volatilityRisk(country.volatility)]}`}>{volatilityRisk(country.volatility)}</Badge></td></tr>)}{!matrix.length && <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No data for this filter combination.</td></tr>}</tbody></table>}</PaginatedTable>
    </section>
  </div>;
}