import { useMemo, useState } from "react";
import { BookOpen, TrendingUp } from "lucide-react";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { Switch } from "@/components/ui/switch";
import { INCOMES, type Row } from "@/lib/fuel-data";
import { regressionTrend, researchCountries, researchInsight, type ResearchCountry } from "@/lib/research";

const incomeColors: Record<string, string> = { High: "var(--chart-1)", "Upper-Middle": "var(--chart-2)", "Lower-Middle": "var(--chart-3)", Low: "var(--chart-4)" };
const incomeClasses: Record<string, string> = { High: "bg-chart-1", "Upper-Middle": "bg-chart-2", "Lower-Middle": "bg-chart-3", Low: "bg-chart-4" };
const money = (value: number | null) => value === null ? "—" : `$${value.toFixed(3)}`;

function ResearchScatter({ countries, rate, trend }: { countries: ResearchCountry[]; rate: "taxRate" | "subsidyRate"; trend: boolean }) {
  const points = regressionTrend(countries, rate);
  return <section className="min-w-0">
    <h3 className="mb-4 text-sm font-semibold">{rate === "taxRate" ? "Fuel tax rate" : "Fuel subsidy rate"} vs GDP per capita</h3>
    <ResponsiveContainer width="100%" height={330}><ScatterChart margin={{ top: 10, right: 15, bottom: 25, left: 0 }}>
      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
      <XAxis type="number" dataKey="gdp" name="GDP per capita" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} label={{ value: "GDP per capita (USD)", position: "bottom", fill: "var(--muted-foreground)", fontSize: 11 }} />
      <YAxis type="number" dataKey={rate} name={rate === "taxRate" ? "Tax rate" : "Subsidy rate"} stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(value) => `${value}%`} domain={['auto', 'auto']} />
      <Tooltip content={({ active, payload }) => {
        const country = payload?.[0]?.payload as Partial<ResearchCountry> | undefined;
        if (!active || !country || !country.country) return null;
        return <div className="rounded-md border border-border bg-popover p-3 text-xs text-popover-foreground"><p className="font-semibold">{country.country} · {country.income}</p><p className="mt-1">GDP per capita: ${country.gdp?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p><p>Tax rate: {country.taxRate?.toFixed(1)}%</p><p>Subsidy rate: {country.subsidyRate?.toFixed(1)}%</p></div>;
      }} />
      {INCOMES.map((income) => <Scatter key={income} name={income} data={countries.filter((country) => country.income === income)} fill={incomeColors[income]} fillOpacity={0.85} isAnimationActive={false} />)}
      {trend && points.length > 0 && <Scatter name="Linear trend" data={points} line={{ stroke: "var(--foreground)", strokeWidth: 2, strokeDasharray: "5 4" }} shape={() => <g />} isAnimationActive={false} />}
    </ScatterChart></ResponsiveContainer>
  </section>;
}

export function ResearchTab({ rows }: { rows: Row[] }) {
  const [showTrend, setShowTrend] = useState(false);
  const countries = useMemo(() => researchCountries(rows), [rows]);
  const insight = useMemo(() => researchInsight(countries), [countries]);
  const { highTax, developingSubsidy } = insight;
  return <div className="min-w-0 space-y-7">
    <section aria-label="Automated Research Insight" className="border-l-4 border-chart-2 bg-chart-2/10 px-5 py-5">
      <h2 className="flex items-center gap-2 text-base font-semibold"><BookOpen className="h-5 w-5 text-chart-2" />Automated Research Insight</h2>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div><p className="text-xs text-muted-foreground">High-Income nations · Average fuel tax</p><p data-testid="research-tax" className="mt-1 font-mono text-3xl font-semibold text-primary">{money(highTax)}<span className="ml-2 text-xs text-muted-foreground">USD/L</span></p><p className="mt-1 text-xs text-muted-foreground">{insight.highCount} countries</p></div>
        <div><p className="text-xs text-muted-foreground">Developing nations · Average fuel subsidy</p><p data-testid="research-subsidy" className="mt-1 font-mono text-3xl font-semibold text-chart-3">{money(developingSubsidy)}<span className="ml-2 text-xs text-muted-foreground">USD/L</span></p><p className="mt-1 text-xs text-muted-foreground">{insight.developingCount} countries</p></div>
      </div>
      <p className="mt-4 text-sm" aria-live="polite">{highTax !== null && developingSubsidy !== null ? `Average high-income fuel tax is ${money(Math.abs(highTax - developingSubsidy))}/L ${highTax >= developingSubsidy ? "higher" : "lower"} than the average developing-country subsidy.` : "Both income groups are needed for a comparison; one or both are absent from the current filters."}</p>
      <p className="mt-2 text-xs text-muted-foreground">Sample data · Equal country weighting · Developing = Upper-Middle, Lower-Middle and Low income · Current filters</p>
    </section>

    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-base font-semibold">GDP, fuel taxes & subsidies</h2><p className="mt-1 text-xs text-muted-foreground">Country averages · Rates as % of base fuel cost</p></div><div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><label htmlFor="research-trend" className="text-sm">Show trend line</label><Switch id="research-trend" checked={showTrend} onCheckedChange={setShowTrend} disabled={countries.length < 2} /></div></div>
      <div className="mb-6 flex flex-wrap gap-x-5 gap-y-2" aria-label="Income level legend">{INCOMES.map((income) => <span key={income} className="flex items-center gap-2 text-xs text-muted-foreground"><span className={`h-2.5 w-2.5 rounded-full ${incomeClasses[income]}`} />{income}</span>)}{showTrend && <span className="text-xs text-muted-foreground">— — Least-squares trend</span>}</div>
      {countries.length ? <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2"><ResearchScatter countries={countries} rate="taxRate" trend={showTrend} /><ResearchScatter countries={countries} rate="subsidyRate" trend={showTrend} /></div> : <div className="grid h-60 place-items-center text-sm text-muted-foreground">No data for this filter combination.</div>}
    </section>
  </div>;
}