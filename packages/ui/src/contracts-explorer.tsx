"use client";

import { useState } from "react";
import { cn } from "./cn";
import { Chip } from "./chip";
import { Panel } from "./panel";
import { SearchInput } from "./search-input";

export interface ContractItem {
  contractor: string;
  subject: string;
  amount: number;
}

export interface ContractsQuarterItem {
  /** e.g. "1T 2025" */
  label: string;
  contracts: ContractItem[];
  totalAmount: number;
}

const euroFormat = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const euroExactFormat = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});
const numberFormat = new Intl.NumberFormat("es-ES");

export function ContractsExplorer({
  quarters,
  className,
}: {
  /** Newest quarter first; the first one is selected initially */
  quarters: ContractsQuarterItem[];
  className?: string;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  if (quarters.length === 0) return null;
  const active = quarters[activeIdx];
  if (!active) return null;

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? active.contracts.filter(
        (c) =>
          c.contractor.toLowerCase().includes(query) || c.subject.toLowerCase().includes(query),
      )
    : active.contracts;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap gap-2">
        {quarters.map((q, idx) => (
          <Chip
            key={q.label}
            selected={idx === activeIdx}
            onClick={() => {
              setActiveIdx(idx);
              setSearchQuery("");
            }}
          >
            {q.label}
          </Chip>
        ))}
      </div>

      <Panel className="overflow-hidden">
        <div className="p-4 border-b border-line bg-surface-sunken/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-ink">
              Contratos menores del trimestre {active.label}
            </h4>
            <p className="text-xs text-ink-muted">
              Mostrando {numberFormat.format(filtered.length)} de{" "}
              {numberFormat.format(active.contracts.length)} contratos ·{" "}
              {euroFormat.format(active.totalAmount)} en total
            </p>
          </div>
          <SearchInput
            aria-label={`Buscar por adjudicatario u objeto en el trimestre ${active.label}`}
            placeholder="Buscar empresa u objeto..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-72"
          />
        </div>

        {filtered.length > 0 ? (
          <>
            <ul className="sm:hidden divide-y divide-line" role="list">
              {filtered.map((c, i) => (
                <li key={`${c.contractor}-${i}`} className="p-4 flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 break-words font-medium text-ink">{c.contractor}</span>
                    <span className="shrink-0 tabular-nums font-semibold text-ink">
                      {euroExactFormat.format(c.amount)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted">{c.subject}</p>
                </li>
              ))}
            </ul>
            <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-sunken/10 text-ink-muted font-medium">
                  <th scope="col" className="p-3 pl-6">Adjudicatario</th>
                  <th scope="col" className="p-3">Objeto del contrato</th>
                  <th scope="col" className="p-3 pr-6 text-right">Importe (IVA incl.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((c, i) => (
                  <tr key={`${c.contractor}-${i}`} className="hover:bg-surface-sunken/20 transition-colors align-top">
                    <td className="p-3 pl-6 font-medium text-ink max-w-56">{c.contractor}</td>
                    <td className="p-3 text-ink-muted">{c.subject}</td>
                    <td className="p-3 pr-6 tabular-nums font-semibold text-ink text-right whitespace-nowrap">
                      {euroExactFormat.format(c.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-ink-muted text-sm">
            Ningún contrato de {active.label} encaja con esa búsqueda.
          </div>
        )}
      </Panel>
    </div>
  );
}
