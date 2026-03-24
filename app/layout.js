import "./globals.css";

export const metadata = {
  title: "ELITE digital agency | Web, AI, Design & Branding Experts in Dubai, Algiers, Batna",
  description:
    "ELITE digital agency builds high-performance websites, AI solutions, branding, and digital experiences for startups and enterprises. Offices in Dubai, Algiers, Batna. Contact us for web development, design, video, blockchain, and automation.",
  keywords:
    "ELITE digital agency, web development, AI, machine learning, branding, design, Dubai, Algiers, Batna, Algeria, video production, blockchain, automation, digital agency, SaaS, NFT, startup, enterprise, creative, portfolio, tech stack, testimonials, remote team, global agency",
  author: "ELITE digital agency",
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  canonical: "https://m2agency.com/",
  openGraph: {
    title: "ELITE digital agency | Web, AI, Design & Branding Experts in Dubai, Algiers, Batna",
    description:
      "ELITE digital agency builds high-performance websites, AI solutions, branding, and digital experiences for startups and enterprises. Offices in Dubai, Algiers, Batna.",
    url: "https://m2agency.com/",
    siteName: "ELITE digital agency",
    locale: "en_US",
    type: "website"
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
