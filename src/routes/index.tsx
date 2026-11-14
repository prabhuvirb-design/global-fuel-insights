import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, FileText, Fuel, Globe2, Landmark, Activity, TrendingUp, HandCoins } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, Legend, ZAxis } from "recharts";
import { DATA, FUELS, INCOMES, REGIONS, YEARS, toCSV, type Row } from "@/lib/fuel-data";
import { PolicyTab } from "@/components/policy-tab";
import { LogisticsTab } from "@/components/logistics-tab";
import { ResearchTab } from "@/components/research-tab";
import { PaginatedTable } from "@/components/paginated-table";
import { ExecutiveSummary } from "@/components/executive-summary";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Global Fuel Economics Dashboard 2020–2026" },
    { name: "description", content: "Fuel prices, taxes, subsidies and volatility across 84 countries and 7 regions, 2020–2026." },
    { property: "og:title", content: "Global Fuel Economics Dashboard 2020–2026" },
    { property: "og:description", content: "Compare fuel prices, taxes, subsidies and volatility across 84 countries." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Dashboard,
});

const ALL = "All";
const SHORT: Record<string, string> = { "North America": "N. America", "Latin America": "Latin Am.", Europe: "Europe", "Middle East & North Africa": "MENA", "Sub-Saharan Africa": "SSA", "South Asia": "S. Asia", "East Asia & Pacific": "E. Asia/Pac" };
const avg = (rows: Row[], k: keyof Row) => rows.length ? rows.reduce((s, r) => s + (r[k] as number), 0) / rows.length : 0;
const usd = (n: number) => `$${n.toFixed(2)}`;
const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--popover-foreground)", fontSize: 12 } };

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: readonly (string | number)[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="h-10 min-w-40 rounded-md border border-input bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
        <option value={ALL}>All</option>
        {options.map((o) => <option key={o} value={String(o)}>{o}</option>)}
      </select>
    </label>
  );
}

function Kpi({ icon: Icon, label, value, sub }: { icon: typeof Fuel; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-executive">
      <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-medium">{label}</span><Icon className="h-4 w-4 text-primary" /></div>
      <div className="mt-3 font-mono text-3xl font-semibold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function Panel({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-border bg-card p-5 shadow-executive ${className}`}><h2 className="mb-4 text-sm font-semibold text-foreground">{title}</h2>{children}</section>;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState("policy");
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [taxChange, setTaxChange] = useState(0);
  const [capacity, setCapacity] = useState("400");
  const [fuel, setFuel] = useState(ALL); const [region, setRegion] = useState(ALL);
  const [income, setIncome] = useState(ALL); const [year, setYear] = useState("2026");

  const base = useMemo(() => DATA.filter((r) => (fuel === ALL || r.fuel === fuel) && (region === ALL || r.region === region) && (income === ALL || r.income === income)), [fuel, region, income]);
  const rows = useMemo(() => base.filter((r) => year === ALL || r.year === +year), [base, year]);
  const countries = new Set(rows.map((r) => r.country)).size;

  const trend = YEARS.map((y) => { const s = base.filter((r) => r.year === y); return { year: y, Net: +avg(s, "net").toFixed(3), Base: +avg(s, "base").toFixed(3), Volatility: +avg(s, "volatility").toFixed(1) }; });
  const byRegion = REGIONS.filter((g) => region === ALL || g === region).map((g) => { const s = rows.filter((r) => r.region === g); return { region: SHORT[g], full: g, Base: +avg(s, "base").toFixed(3), Tax: +avg(s, "tax").toFixed(3), Subsidy: +avg(s, "subsidy").toFixed(3) }; });
  const byCountry = Object.values(rows.reduce<Record<string, { country: string; gdp: number; net: number; n: number; vol: number; region: string; income: string }>>((acc, r) => {
    const c = (acc[r.country] ??= { country: r.country, gdp: 0, net: 0, n: 0, vol: 0, region: r.region, income: r.income });
    c.gdp += r.gdp; c.net += r.net; c.vol += r.volatility; c.n++; return acc;
  }, {})).map((c) => ({ ...c, gdp: Math.round(c.gdp / c.n), net: +(c.net / c.n).toFixed(3), vol: +(c.vol / c.n).toFixed(1) }));
  const top = useMemo(() => [...byCountry].sort((a, b) => b.net - a.net), [rows]);

  const download = () => {
    const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a");
    a.href = url; a.download = `fuel-economics_${fuel}_${region}_${income}_${year}.csv`.replace(/[^\w.-]+/g, "-");
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  };

  return (
    <div className="executive-dashboard min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 shadow-executive backdrop-blur">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground"><Fuel className="h-5 w-5" /></div>
            <div><h1 className="text-xl font-semibold leading-tight">Global Fuel Economics Dashboard <span className="text-primary">2020–2026</span></h1>
              <p className="text-xs text-muted-foreground">84 countries · 7 regions · prices in USD per litre (sample data)</p></div>
          </div>
          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <Select label="Fuel Type" value={fuel} onChange={setFuel} options={FUELS} />
            <Select label="Global Region" value={region} onChange={setRegion} options={REGIONS} />
            <Select label="Income Level" value={income} onChange={setIncome} options={INCOMES} />
            <Select label="Year" value={year} onChange={setYear} options={YEARS} />
            <Button onClick={download} variant="outline" className="h-10 px-4 font-semibold">
              <Download className="h-4 w-4" /> Download CSV <span className="font-mono text-xs opacity-70">({rows.length})</span>
            </Button>
            <Button onClick={() => setSummaryOpen(true)} className="h-10 whitespace-normal px-4"><FileText />Generate Executive Summary</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-1 gap-1 sm:grid-cols-3" aria-label="Dashboard views">
            <TabsTrigger value="policy" className="min-h-10 whitespace-normal text-center">Policy &amp; Taxation (Dr. Mitchell)</TabsTrigger>
            <TabsTrigger value="prices" className="min-h-10 whitespace-normal text-center">Supply Chain &amp; Logistics (Marcus)</TabsTrigger>
            <TabsTrigger value="countries" className="min-h-10 whitespace-normal text-center">Macroeconomic Research (Prof. Rodriguez)</TabsTrigger>
          </TabsList>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={Globe2} label="Countries" value={String(countries)} sub={`${rows.length} records`} />
          <Kpi icon={Fuel} label="Avg Net Price" value={usd(avg(rows, "net"))} sub="retail, per litre" />
          <Kpi icon={TrendingUp} label="Avg Base" value={usd(avg(rows, "base"))} sub="pre-tax cost" />
          <Kpi icon={Landmark} label="Avg Tax" value={usd(avg(rows, "tax"))} sub="per litre" />
          <Kpi icon={HandCoins} label="Avg Subsidy" value={usd(avg(rows, "subsidy"))} sub="per litre" />
          <Kpi icon={Activity} label="Volatility" value={avg(rows, "volatility").toFixed(1)} sub="index 0–100" />
        </div>

        <TabsContent value="policy"><PolicyTab rows={rows} trendRows={base} year={year} change={taxChange} setChange={setTaxChange} /></TabsContent>
        <TabsContent value="prices" className="grid min-w-0 grid-cols-1 gap-6 overflow-x-clip lg:grid-cols-2 data-[state=inactive]:hidden">
          <div className="min-w-0 lg:col-span-2"><LogisticsTab rows={rows} trendRows={base} fuel={fuel} year={year} capacity={capacity} setCapacity={setCapacity} /></div>
          <Panel title="Price trend 2020–2026 (USD/L)">
            <ResponsiveContainer width="100%" height={280}><LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip {...tip} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="Net" stroke="var(--chart-1)" strokeWidth={2.5} dot={{ r: 3 }} /><Line dataKey="Base" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 4" />
            </LineChart></ResponsiveContainer>
          </Panel>
          <Panel title="Price composition by region (USD/L)">
            <ResponsiveContainer width="100%" height={280}><BarChart data={byRegion}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="region" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip {...tip} labelFormatter={(_, p) => p?.[0]?.payload?.full} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Base" stackId="a" fill="var(--chart-2)" /><Bar dataKey="Tax" stackId="a" fill="var(--chart-1)" /><Bar dataKey="Subsidy" fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </Panel>
          <Panel title="GDP per capita vs net retail price">
            <ResponsiveContainer width="100%" height={280}><ScatterChart>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" dataKey="gdp" name="GDP/cap" scale="log" domain={["auto", "auto"]} stroke="var(--muted-foreground)" fontSize={12} tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
              <YAxis type="number" dataKey="net" name="Net price" stroke="var(--muted-foreground)" fontSize={12} /><ZAxis dataKey="country" name="Country" range={[50, 50]} />
              <Tooltip {...tip} cursor={{ strokeDasharray: "3 3" }} /><Scatter data={byCountry} fill="var(--chart-1)" fillOpacity={0.75} />
            </ScatterChart></ResponsiveContainer>
          </Panel>
          <Panel title="Volatility index trend">
            <ResponsiveContainer width="100%" height={280}><BarChart data={trend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
              <Tooltip {...tip} /><Bar dataKey="Volatility" fill="var(--chart-4)" radius={[3, 3, 0, 0]} />
            </BarChart></ResponsiveContainer>
          </Panel>
        </TabsContent>

        <TabsContent value="countries" className="min-w-0 space-y-7 overflow-x-clip">
        <ResearchTab rows={rows} />
        <Panel title={`Country breakdown · ${year === ALL ? "all years" : year} · sorted by net price`}>
          <PaginatedTable items={top}>{(pageRows, offset) => (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                <tr>{["#", "Country", "Region", "Income", "GDP/cap", "Net price", "Volatility"].map((h) => <th key={h} className="border-b border-border px-3 py-2">{h}</th>)}</tr>
              </thead>
              <tbody>{pageRows.map((c, i) => (
                <tr key={c.country} className="border-b border-border/60 hover:bg-muted/50">
                  <td className="px-3 py-2 font-mono text-muted-foreground">{offset + i + 1}</td><td className="px-3 py-2 font-medium">{c.country}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.region}</td><td className="px-3 py-2">{c.income}</td>
                  <td className="px-3 py-2 font-mono">${c.gdp.toLocaleString()}</td><td className="px-3 py-2 font-mono text-primary">{usd(c.net)}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-20 rounded bg-muted"><div className="h-full rounded bg-chart-4" style={{ width: `${c.vol}%` }} /></div><span className="font-mono text-xs">{c.vol}</span></div></td>
                </tr>))}
                {!top.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">No data for this filter combination.</td></tr>}
              </tbody>
            </table>
          )}</PaginatedTable>
        </Panel>
        </TabsContent>
        </Tabs>
      </main>
      <ExecutiveSummary open={summaryOpen} onOpenChange={setSummaryOpen} rows={rows} trendRows={base} tab={activeTab} filters={`Fuel: ${fuel} · Region: ${region} · Income: ${income} · Year: ${year}`} taxChange={taxChange} capacity={capacity} />
    </div>
  );
}
