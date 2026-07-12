import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/demografia`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/paro`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/renta`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/vivienda`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/transporte`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/contratos-menores`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/turismo`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/deuda`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/presupuestos`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${siteUrl}/boja`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/clima`, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/mapa`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/proyectos/termografia-fachadas`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/datos`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/transparencia`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${siteUrl}/diseno`, changeFrequency: "monthly", priority: 0.3 },
  ];
}
