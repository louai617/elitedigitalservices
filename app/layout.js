import "./globals.css";
import { site } from "@/lib/site-config";

export const metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} (${site.shortName}) | Web, AI, Branding & Digital Marketing in Qatar`,
    template: `%s | ${site.shortName}`,
  },
  description: site.description,
  keywords: [
    "Elite Media Solutions",
    "EMS Qatar",
    "digital marketing Qatar",
    "web development Doha",
    "AI automation Qatar",
    "social media marketing Qatar",
    "branding Doha",
    "paid advertising GCC",
    "SEO Qatar",
    "lead generation Doha",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: site.icon,
    shortcut: site.icon,
    apple: site.icon,
  },
  openGraph: {
    type: "website",
    url: site.url,
    siteName: site.name,
    title: `${site.name} (${site.shortName}) | Web, AI, Branding & Digital Marketing in Qatar`,
    description: site.description,
    locale: "en_QA",
    images: [{ url: site.ogImage, width: 1200, height: 630, alt: site.logo.alt }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} (${site.shortName})`,
    description: site.description,
    images: [site.ogImage],
  },
};

/** Organization schema — sitewide, so search engines resolve the EMS entity. */
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  alternateName: site.shortName,
  url: site.url,
  logo: `${site.url}${site.logo.src}`,
  description: site.description,
  email: site.contact.email,
  sameAs: [site.social.instagram],
  address: {
    "@type": "PostalAddress",
    addressLocality: "Doha",
    addressCountry: "QA",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        {children}
      </body>
    </html>
  );
}
