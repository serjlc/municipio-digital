import { municipality } from "@municipio/config";
import { Footer, Header, SkipLink } from "@municipio/ui";
import type { Metadata } from "next";
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const siteName = `${municipality.shortName} Digital`;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const description = `Datos públicos de ${municipality.name} presentados de forma clara, y proyectos ciudadanos que generan información nueva sobre el municipio. Software libre, reutilizable por cualquier municipio.`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} · Datos abiertos y proyectos ciudadanos`,
    template: `%s · ${siteName}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName,
    locale: "es_ES",
    title: `${siteName} · Datos abiertos y proyectos ciudadanos`,
    description,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  description,
  inLanguage: "es",
  about: {
    "@type": "City",
    name: municipality.name,
    geo: {
      "@type": "GeoCoordinates",
      latitude: municipality.coordinates.lat,
      longitude: municipality.coordinates.lon,
    },
  },
};

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/demografia", label: "Demografía" },
  { href: "/#proyectos", label: "Proyectos" },
  { href: "/diseno", label: "Diseño" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${instrumentSans.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SkipLink />
        <Header siteName={siteName} items={navItems} />
        <main id="contenido" className="flex-1">
          {children}
        </main>
        <Footer
          siteName={siteName}
          description={`Datos públicos de ${municipality.name} y proyectos ciudadanos, en abierto. Cualquier municipio puede reutilizar este proyecto con su propia configuración.`}
          groups={[
            {
              title: "Proyecto",
              links: [
                {
                  label: "Código en GitHub",
                  href: "https://github.com/serjlc/municipio-digital",
                  external: true,
                },
                {
                  label: "island.is, la inspiración",
                  href: "https://github.com/island-is/island.is",
                  external: true,
                },
              ],
            },
            {
              title: "Fuentes de datos",
              links: [
                ...(municipality.sources.ckan
                  ? [
                      {
                        label: `Datos abiertos de ${municipality.shortName}`,
                        href: municipality.sources.ckan,
                        external: true,
                      },
                    ]
                  : []),
                {
                  label: "Junta de Andalucía",
                  href: "https://www.juntadeandalucia.es/datosabiertos/portal/",
                  external: true,
                },
                { label: "datos.gob.es", href: "https://datos.gob.es", external: true },
              ],
            },
          ]}
          note={`Proyecto ciudadano de software libre (licencia MIT), sin vinculación con el Ayuntamiento de ${municipality.name}. Los datos mostrados pertenecen a sus fuentes originales y se citan en cada página.`}
        />
      </body>
    </html>
  );
}
