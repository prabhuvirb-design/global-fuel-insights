import { useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { paginate } from "@/lib/pagination";

export function PaginatedTable<T>({ items, children }: { items: T[]; children: (items: T[], offset: number) => ReactNode }) {
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [previousItems, setPreviousItems] = useState(items);
  if (previousItems !== items) { setPreviousItems(items); setPage(1); }
  const result = paginate(items, page, size);
  return <div className="min-w-0">
    <div className="overflow-x-auto">{children(result.items, result.start)}</div>
    <nav aria-label="Table pagination" className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
      <span>{result.total ? result.start + 1 : 0}–{Math.min(result.start + size, result.total)} of {result.total}</span>
      <div className="flex items-center gap-2"><label className="flex items-center gap-2">Rows<select aria-label="Rows per page" value={size} onChange={(event) => { setSize(Number(event.target.value)); setPage(1); }} className="h-8 rounded-md border border-input bg-card px-2 text-foreground">{[5,10,25,50].map((value) => <option key={value} value={value}>{value}</option>)}</select></label><Button size="icon" variant="outline" aria-label="Previous page" disabled={result.current === 1} onClick={() => setPage(result.current - 1)}><ChevronLeft /></Button><span aria-live="polite">{result.current} / {result.pages}</span><Button size="icon" variant="outline" aria-label="Next page" disabled={result.current === result.pages} onClick={() => setPage(result.current + 1)}><ChevronRight /></Button></div>
    </nav>
  </div>;
}