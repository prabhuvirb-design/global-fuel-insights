import { Printer } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { type Row } from "@/lib/fuel-data";
import { simulatePolicy, regionalLeaders } from "@/lib/policy-simulation";
import { cheapestRefueling, countryPrices, priceForecast, volatilityRisk } from "@/lib/logistics";
import { researchCountries, researchInsight } from "@/lib/research";

const money = (value: number | null | undefined) => value == null ? "Unavailable" : `$${value.toFixed(3)}`;
export function ExecutiveSummary({ open, onOpenChange, rows, trendRows, tab, filters, taxChange, capacity }: { open: boolean; onOpenChange: (open: boolean) => void; rows: Row[]; trendRows: Row[]; tab: string; filters: string; taxChange: number; capacity: string }) {
  const countries = countryPrices(rows);
  const average = (key: "net" | "tax" | "subsidy") => rows.length ? rows.reduce((sum, row) => sum + row[key], 0) / rows.length : null;
  const insight = researchInsight(researchCountries(rows));
  const fleet = cheapestRefueling(rows, Number(capacity));
  const projection = priceForecast(trendRows).find((point) => point.year === 2027);
  const retail = rows.length ? rows.reduce((sum, row) => sum + simulatePolicy(row, taxChange).retail, 0) / rows.length : null;
  const title = tab === "policy" ? "Policy & Taxation (Dr. Mitchell)" : tab === "prices" ? "Supply Chain & Logistics (Marcus)" : "Macroeconomic Research (Prof. Rodriguez)";
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="executive-print max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto bg-card p-7 sm:p-10">
    <div className="border-b border-border pb-5"><p className="mb-2 text-xs font-semibold uppercase text-primary">Global Fuel Economics · 2020–2026</p><DialogTitle className="text-2xl">Executive Summary</DialogTitle><DialogDescription className="mt-2">{title}</DialogDescription><p className="mt-3 text-xs text-muted-foreground">{filters}</p></div>
    <div className="grid grid-cols-2 gap-4 border-b border-border py-4 sm:grid-cols-4">{[["Countries", countries.length], ["Retail / L", money(average("net"))], ["Tax / L", money(average("tax"))], ["Subsidy / L", money(average("subsidy"))]].map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-mono text-lg font-semibold">{value}</p></div>)}</div>
    <section className="py-3"><h2 className="mb-4 font-semibold">Active insights</h2>
      {tab === "policy" && <div className="space-y-3 text-sm"><p>Tax adjustment: <strong>{taxChange > 0 ? "+" : ""}{taxChange}%</strong>. Simulated consumer retail price: <strong>{money(retail)}/L</strong>.</p><p>Base costs and state subsidies are held constant.</p><ul className="space-y-2">{regionalLeaders(rows, taxChange).map((leader) => <li key={leader.region}><strong>{leader.region}:</strong> {leader.taxCountry} leads tax intensity ({leader.taxIntensity.toFixed(1)}%); {leader.subsidyCountry} leads subsidy intensity ({leader.subsidyIntensity.toFixed(1)}%).</li>)}</ul></div>}
      {tab === "prices" && <div className="space-y-3 text-sm"><p>Fuel tank capacity: <strong>{capacity || "Unavailable"} L</strong>.</p><ol className="list-inside list-decimal space-y-2">{fleet.map((country) => <li key={country.country}><strong>{country.country}</strong> — {money(country.price)}/L; full tank <strong>${country.total.toFixed(2)}</strong>.</li>)}</ol>{!fleet.length && <p>No refueling ranking available for this capacity or filter selection.</p>}<p>High-volatility countries: <strong>{countries.filter((country) => volatilityRisk(country.volatility) === "High Volatility").length}</strong> of {countries.length}.</p><p>2027 illustrative price: <strong>{money(projection?.forecast)}/L</strong>{projection?.band && `; range ${money(projection.band[0])}–${money(projection.band[1])}/L`}.</p><p className="text-xs text-muted-foreground">Forecast uses the 2024–2026 linear trend with a historical-change range, minimum ±10%. Not a market prediction.</p></div>}
      {tab === "countries" && <div className="space-y-3 text-sm"><p>High-income average fuel tax: <strong>{money(insight.highTax)}/L</strong> across {insight.highCount} countries.</p><p>Developing-country average subsidy: <strong>{money(insight.developingSubsidy)}/L</strong> across {insight.developingCount} countries.</p><p>Developing includes Upper-Middle, Lower-Middle and Low income; each country is equally weighted. Tax and subsidy rates are measured as percentages of base cost.</p></div>}
      {!rows.length && <p className="mt-3 text-sm text-muted-foreground">No data matches the current filters.</p>}
    </section><footer className="border-t border-border pt-4 text-xs text-muted-foreground">Illustrative sample data · USD per litre · {rows.length} selected records</footer><Button className="print-control mt-3 justify-self-start" onClick={() => window.print()}><Printer />Print / Save PDF</Button>
  </DialogContent></Dialog>;
}