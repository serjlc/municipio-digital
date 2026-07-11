import { municipality } from "@municipio/config";
import { fetchWeather } from "@municipio/datos";
import { Alert, Panel, Section, SourceNote, Stat, StatGroup } from "@municipio/ui";
import type { Metadata } from "next";
import { PageHero } from "../../components/page-hero";

export const maxDuration = 60;
export const revalidate = 3600;

const dayFormat = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" });
const hourFormat = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" });

export const metadata: Metadata = {
  title: `¿Qué tiempo hace en ${municipality.shortName}?`,
  description: `El tiempo en ${municipality.name} ahora y la predicción oficial de AEMET para los próximos siete días, con el estado de la playa.`,
};

/*
 * AEMET sky states are sometimes noun phrases ("Intervalos nubosos",
 * "Nubes altas") and sometimes bare adjectives ("Nuboso", "Despejado");
 * the sentence needs "cielo" only before the adjectives.
 */
function skyPhrase(sky: string): string {
  const lower = sky.toLowerCase();
  const nounStart = /^(intervalos|nubes|niebla|bruma|calima|lluvia|chubascos|tormenta)/;
  return nounStart.test(lower) ? `con ${lower}` : `con cielo ${lower}`;
}

const sources = [
  {
    name: "AEMET OpenData",
    href: "https://www.aemet.es",
    license: "elaboración propia a partir de sus datos",
  },
];

export default async function ClimaPage() {
  const weather = await fetchWeather(municipality);
  const today = weather?.days[0];

  return (
    <>
      <PageHero
        eyebrow="Clima y costa"
        title={
          <>
          ¿Qué <em className="not-italic text-brand">tiempo</em> hace en {municipality.shortName}?
          </>
        }
      >
        {weather && today ? (
          <p className="mt-6 max-w-2xl text-lead text-ink-muted">
            {weather.now ? (
              <>
                Ahora mismo hay{" "}
                <strong className="text-ink">{weather.now.temperature} °C</strong> (medidos a las{" "}
                {hourFormat.format(new Date(weather.now.time))} en la estación AEMET de{" "}
                {weather.now.stationName}, la más cercana), y{" "}
              </>
            ) : (
              <>Para </>
            )}
            hoy se esperan entre <strong className="text-ink">{today.min}</strong> y{" "}
            <strong className="text-ink">{today.max} °C</strong>
            {today.sky ? `, ${skyPhrase(today.sky)}` : ""}.
          </p>
        ) : (
          <Alert tone="warning" className="mt-6 max-w-2xl" title="Datos no disponibles ahora mismo">
            No hemos podido consultar AEMET. Si estás desarrollando en local, revisa que exista la
            clave gratuita en el archivo .env (el .env.example explica cómo conseguirla). Si no,
            suele ser algo temporal: vuelve a intentarlo en un rato.
          </Alert>
        )}
      </PageHero>

      {weather && today ? (
        <>
          <Section id="hoy" title="Las cifras de hoy" hideTitle className="bg-surface-sunken">
            <StatGroup>
              <Stat
                label="Máxima y mínima de hoy"
                value={`${today.max}° / ${today.min}°`}
                context={today.sky ?? "Predicción para el municipio"}
              />
              {today.rainChance !== undefined ? (
                <Stat
                  label="Probabilidad de lluvia"
                  value={`${today.rainChance} %`}
                  context="Para el conjunto del día"
                />
              ) : null}
              {today.uvMax !== undefined ? (
                <Stat
                  label="Índice UV máximo"
                  value={String(today.uvMax)}
                  context={today.uvMax >= 8 ? "Muy alto: protección solar" : "Radiación ultravioleta"}
                />
              ) : null}
              {weather.now?.windKmh !== undefined ? (
                <Stat
                  label="Viento ahora"
                  value={`${weather.now.windKmh} km/h`}
                  context={weather.now.humidity !== undefined ? `Humedad ${weather.now.humidity} %` : "Medido en la estación más cercana"}
                />
              ) : null}
            </StatGroup>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          <Section
            id="semana"
            title="Los próximos siete días"
            description="La predicción municipal oficial de AEMET, que se actualiza varias veces al día."
          >
            <ul className="flex flex-col divide-y divide-line" role="list">
              {weather.days.map((day) => (
                <li
                  key={day.date}
                  className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1 py-4 first:pt-0 sm:grid-cols-[11rem_1fr_auto]"
                >
                  <span className="font-medium text-ink capitalize">
                    {dayFormat.format(new Date(day.date))}
                  </span>
                  <span className="text-ink-muted max-sm:col-span-2 max-sm:row-start-2">
                    {[day.sky, day.rainChance ? `${day.rainChance} % de lluvia` : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <span className="tabular-nums text-right">
                    <strong className="text-ink">{day.max}°</strong>
                    <span className="text-ink-faint"> / {day.min}°</span>
                  </span>
                </li>
              ))}
            </ul>
            <SourceNote className="mt-8" sources={sources} />
          </Section>

          {weather.beach ? (
            <Section
              id="playa"
              title={`La playa: ${weather.beach.name}`}
              description="Lo que AEMET prevé para la playa: cielo, viento, oleaje y temperatura del agua."
              className="bg-surface-sunken"
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {weather.beach.days.map((day) => (
                  <Panel key={day.date} className="p-5">
                    <p className="font-semibold text-ink capitalize">
                      {dayFormat.format(new Date(day.date))}
                    </p>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      {day.sky ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Cielo</dt>
                          <dd className="text-ink text-right">{day.sky}</dd>
                        </div>
                      ) : null}
                      {day.wind ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Viento</dt>
                          <dd className="text-ink capitalize text-right">{day.wind}</dd>
                        </div>
                      ) : null}
                      {day.waves ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Oleaje</dt>
                          <dd className="text-ink capitalize text-right">{day.waves}</dd>
                        </div>
                      ) : null}
                      {day.waterTemperature !== undefined ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Agua</dt>
                          <dd className="text-ink tabular-nums text-right">{day.waterTemperature} °C</dd>
                        </div>
                      ) : null}
                      {day.maxTemperature !== undefined ? (
                        <div className="flex justify-between gap-3">
                          <dt className="text-ink-muted">Máxima</dt>
                          <dd className="text-ink tabular-nums text-right">{day.maxTemperature} °C</dd>
                        </div>
                      ) : null}
                    </dl>
                  </Panel>
                ))}
              </div>
              <SourceNote className="mt-8" sources={sources} />
            </Section>
          ) : null}
        </>
      ) : null}
    </>
  );
}
