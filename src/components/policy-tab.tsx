import { useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { type Row } from "@/lib/fuel-data";
import { policyTrend, regionalLeaders, simulatePolicy, TAX_CHANGE_MAX, TAX_CHANGE_MIN } from "@/lib/policy-simulation";

const tooltipStyle = { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 };
const shortRegion: Record<string, string> = { "North America": "N. America", "Latin America": "Latin Am.", "Europe": "Europe", "Middle East & North Africa": "MENA", "Sub-Saharan Africa": "SSA", "South Asia": "S. Asia", "East Asia & Pacific": "E. Asia/Pac" };
const currency = (value: number) => `$${value.toFixed(3)}`;

export function PolicyTab({ rows, year }: { rows: Row[]; year: string }) {
  const [change, setChange] = useState(0);
  const trend = useMemo(() => policyTrend(rows, change), [rows, change]);
  const leaders = useMemo(() => regionalLeaders(rows, change), [rows, change]);
  const baseline = rows.length ? rows.reduce((sum, row) => sum + simulatePolicy(row, 0).retail, 0) / rows.length : 0;
  const retail = rows.length ? rows.reduce((sum, row) => sum + simulatePolicy(row, change).retail, 0) / rows.length : 0;
  const delta = retail - baseline;

  return <div className="space-y-6">
    <section className="rounded-lg border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold"><SlidersHorizontal className="h-4 w-4 text-primary" />Policy Simulation Sandbox</h2>
        <Button variant="ghost" size="sm" onClick={() => setChange(0)} disabled={change === 0}><RotateCcw />Reset</Button>
      </div>
      <div className="mt-5 grid items-center gap-8 lg:grid-cols-2">
        <div>
          <div className="mb-5 flex items-baseline justify-between gap-3"><label id="tax-adjustment-label" className="text-sm text-muted-foreground">Fuel tax adjustment</label><output className="font-mono text-2xl font-semibold text-primary" aria-live="polite">{change > 0 ? "+" : ""}{change}%</output></div>
          <Slider aria-labelledby="tax-adjustment-label" min={TAX_CHANGE_MIN} max={TAX_CHANGE_MAX} step={1} value={[change]} onValueChange={(values) => setChange(values[0] ?? 0)} />
          <div className="mt-3 flex justify-between font-mono text-xs text-muted-foreground"><span>−50%</span><span>0%</span><span>+50%</span></div>
        </div>
        <dl className="grid grid-cols-2 gap-5 border-t border-border pt-5 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <div><dt className="text-xs text-muted-foreground">Simulated retail · USD/L</dt><dd data-testid="simulated-retail" className="mt-2 font-mono text-2xl font-semibold">{rows.length ? currency(retail) : "—"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Change from baseline · USD/L</dt><dd data-testid="retail-delta" className="mt-2 font-mono text-2xl font-semibold text-primary">{rows.length ? `${delta >= 0 ? "+" : "−"}${currency(Math.abs(delta))}` : "—"}</dd></div>
        </dl>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">Sample scenario · Base costs and subsidies held constant · {year === "All" ? "2020–2026" : year} · {rows.length} records</p>
    </section>

    <section className="border-b border-border pb-6">
      <div className="mb-5"><h2 className="text-sm font-semibold">Simulated price composition & consumer retail price</h2><p className="mt-1 text-xs text-muted-foreground">USD per litre · State subsidy deducted below zero</p></div>
      {trend.length ? <ResponsiveContainer width="100%" height={340}><ComposedChart data={trend} stackOffset="sign" margin={{ top: 10, right: 5, left: 5, bottom: 10 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} />
        <YAxis yAxisId="cost" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(value) => `$${value.toFixed(2)}`} />
        <YAxis yAxisId="retail" orientation="right" stroke="var(--chart-4)" fontSize={11} tickFormatter={(value) => `$${value.toFixed(2)}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => currency(value)} labelFormatter={(value) => `Year ${value}`} />
        <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
        <Bar yAxisId="cost" dataKey="base" name="Base Cost" stackId="cost" fill="var(--chart-2)" maxBarSize={64} isAnimationActive={false} />
        <Bar yAxisId="cost" dataKey="tax" name="Government Tax" stackId="cost" fill="var(--chart-1)" maxBarSize={64} isAnimationActive={false} />
        <Bar yAxisId="cost" dataKey="subsidy" name="State Subsidy" stackId="cost" fill="var(--chart-3)" maxBarSize={64} isAnimationActive={false} />
        <Line yAxisId="retail" dataKey="retail" name="Consumer Retail Price" stroke="var(--chart-4)" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={false} />
      </ComposedChart></ResponsiveContainer> : <div className="grid h-60 place-items-center text-sm text-muted-foreground">No data for this filter combination.</div>}
    </section>

    <section>
      <h2 className="text-sm font-semibold">Regional comparison · highest tax intensity vs highest fuel subsidies</h2>
      <p className="mt-1 mb-5 text-xs text-muted-foreground">Regional country leaders · Tax and subsidy as % of base cost · Adjusted tax scenario</p>
      {leaders.length ? <>
        <ResponsiveContainer width="100%" height={Math.max(240, leaders.length * 55 + 60)}><BarChart data={leaders} layout="vertical" margin={{ right: 24, left: 5 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(value) => `${value}%`} />
          <YAxis type="category" dataKey="region" width={84} stroke="var(--muted-foreground)" fontSize={11} tickFormatter={(value) => shortRegion[value] ?? value} />
          <Tooltip contentStyle={tooltipStyle} formatter={(value: number, name: string, item) => [`${value.toFixed(1)}% · ${name === "Tax intensity" ? item.payload.taxCountry : item.payload.subsidyCountry}`, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="taxIntensity" name="Tax intensity" fill="var(--chart-1)" radius={[0, 3, 3, 0]} maxBarSize={16} isAnimationActive={false} />
          <Bar dataKey="subsidyIntensity" name="Subsidy intensity" fill="var(--chart-3)" radius={[0, 3, 3, 0]} maxBarSize={16} isAnimationActive={false} />
        </BarChart></ResponsiveContainer>
        <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-muted-foreground"><tr><th className="py-3 pr-4 font-medium">Region</th><th className="py-3 pr-4 font-medium">Highest tax intensity</th><th className="py-3 font-medium">Highest fuel subsidy</th></tr></thead><tbody>{leaders.map((leader) => <tr key={leader.region} className="border-t border-border"><td className="py-3 pr-4">{leader.region}</td><td className="py-3 pr-4">{leader.taxCountry} <span className="font-mono text-primary">{leader.taxIntensity.toFixed(1)}%</span></td><td className="py-3">{leader.subsidyCountry} <span className="font-mono text-chart-3">{leader.subsidyIntensity.toFixed(1)}%</span></td></tr>)}</tbody></table></div>
      </> : <div className="grid h-60 place-items-center text-sm text-muted-foreground">No data for this filter combination.</div>}
    </section>
  </div>;
}