import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const description =
  "Plataforma de gestión de proyectos de construcción para AEC en México y LATAM. Tareas, control documental, Kota AI y WhatsApp en una sola herramienta.";

export const metadata: Metadata = {
  metadataBase: new URL("https://builtek.app"),
  title: {
    default: "Builtek — El OS de la construcción",
    template: "%s — Builtek",
  },
  description,
  keywords: [
    "software construccion mexico",
    "gestion proyectos construccion",
    "control documental obra",
    "alternativa procore latam",
    "plataforma aec mexico",
    "builtek",
  ],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://builtek.app",
    siteName: "Builtek",
    title: "Builtek — El OS de la construcción",
    description,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Builtek — El OS de la construcción",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Builtek",
    description,
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Builtek",
  url: "https://builtek.app",
  description:
    "Plataforma de gestión de proyectos de construcción para AEC en México y LATAM. Tareas, control documental, Kota AI y WhatsApp.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  inLanguage: "es-MX",
  offers: {
    "@type": "Offer",
    priceCurrency: "MXN",
    price: "1890",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      billingDuration: 1,
      billingIncrement: 1,
      unitCode: "MON",
    },
    description: "Plan Starter. Planes desde $1,890 hasta $12,990 MXN/mes.",
  },
  audience: {
    "@type": "Audience",
    audienceType:
      "Constructoras, residentes de obra, directores de proyecto en México y LATAM",
  },
  provider: {
    "@type": "Organization",
    name: "INGENIUM ANALYTICS, S. de R.L. de C.V.",
    url: "https://builtek.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(softwareApplicationSchema),
          }}
        />
        {children}
      </body>
    </html>
  );
}
