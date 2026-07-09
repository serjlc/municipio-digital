"use client";

import { useState } from "react";
import { cn } from "./cn";
import { Card, CardTitle } from "./card";

export interface SectionPopulation {
  section: number;
  men: number;
  women: number;
  total: number;
}

export interface DistrictPopulation {
  name: string;
  men: number;
  women: number;
  total: number;
  sections: SectionPopulation[];
}

const numberFormat = new Intl.NumberFormat("es-ES");

export function DistrictStats({
  districts,
  className,
}: {
  districts: DistrictPopulation[];
  className?: string;
}) {
  const [activeDistrictIdx, setActiveDistrictIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!districts || districts.length === 0) return null;

  const activeDistrict = districts[activeDistrictIdx];
  if (!activeDistrict) return null;

  const filteredSections = activeDistrict.sections.filter((s) => {
    if (!searchQuery) return true;
    return String(s.section).includes(searchQuery);
  });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap gap-2">
        {districts.map((d, idx) => (
          <button
            key={d.name}
            onClick={() => {
              setActiveDistrictIdx(idx);
              setSearchQuery("");
            }}
            className={cn(
              "px-4 py-2 pointer-coarse:min-h-11 text-sm font-medium rounded-field border transition-all duration-200 cursor-pointer",
              idx === activeDistrictIdx
                ? "bg-brand border-brand text-on-brand shadow-sm font-semibold"
                : "bg-surface-raised border-line text-ink-muted hover:text-ink hover:border-ink-faint",
            )}
          >
            {d.name}
          </button>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-surface-raised">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
            Población total ({activeDistrict.name})
          </span>
          <CardTitle className="text-3xl font-bold text-brand mt-1">
            {numberFormat.format(activeDistrict.total)}
          </CardTitle>
          <p className="text-sm text-ink-muted mt-2">Vecinos empadronados en este distrito.</p>
        </Card>

        <Card className="bg-surface-raised">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Hombres</span>
          <CardTitle className="text-3xl font-bold text-ink mt-1">
            {numberFormat.format(activeDistrict.men)}
          </CardTitle>
          <p className="text-sm text-ink-muted mt-2">
            {activeDistrict.total > 0
              ? `${numberFormat.format(Math.round((activeDistrict.men / activeDistrict.total) * 100))}% del total`
              : ""}
          </p>
        </Card>

        <Card className="bg-surface-raised">
          <span className="text-xs font-semibold uppercase tracking-widest text-ink-muted">Mujeres</span>
          <CardTitle className="text-3xl font-bold text-ink mt-1">
            {numberFormat.format(activeDistrict.women)}
          </CardTitle>
          <p className="text-sm text-ink-muted mt-2">
            {activeDistrict.total > 0
              ? `${numberFormat.format(Math.round((activeDistrict.women / activeDistrict.total) * 100))}% del total`
              : ""}
          </p>
        </Card>
      </div>

      <div className="rounded-card border border-line bg-surface-raised overflow-hidden shadow-card">
        <div className="p-4 border-b border-line bg-surface-sunken/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-ink">
              Secciones electorales de {activeDistrict.name}
            </h4>
            <p className="text-xs text-ink-muted">
              Mostrando {filteredSections.length} de {activeDistrict.sections.length} secciones
            </p>
          </div>
          <div className="relative">
            <input
              type="search"
              aria-label={`Buscar número de sección en ${activeDistrict.name}`}
              placeholder="Buscar número de sección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-3 py-1.5 pointer-coarse:min-h-11 text-sm rounded-field border border-line bg-surface-raised text-ink placeholder:text-ink-faint focus:border-brand"
            />
          </div>
        </div>

        {filteredSections.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-surface-sunken/10 text-ink-muted font-medium">
                  <th scope="col" className="p-2 pl-4 sm:p-3 sm:pl-6">Sección</th>
                  <th scope="col" className="p-2 sm:p-3">Hombres</th>
                  <th scope="col" className="p-2 sm:p-3">Mujeres</th>
                  <th scope="col" className="p-2 pr-4 text-right sm:p-3 sm:pr-6">Población total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredSections.map((s) => (
                  <tr key={s.section} className="hover:bg-surface-sunken/20 transition-colors">
                    <th scope="row" className="p-2 pl-4 text-left font-semibold text-ink sm:p-3 sm:pl-6">
                      Sección {s.section}
                    </th>
                    <td className="p-2 tabular-nums text-ink-muted sm:p-3">{numberFormat.format(s.men)}</td>
                    <td className="p-2 tabular-nums text-ink-muted sm:p-3">{numberFormat.format(s.women)}</td>
                    <td className="p-2 pr-4 tabular-nums font-bold text-ink text-right sm:p-3 sm:pr-6">
                      {numberFormat.format(s.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-ink-muted text-sm">
            No se ha encontrado ninguna sección electoral con el número "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
