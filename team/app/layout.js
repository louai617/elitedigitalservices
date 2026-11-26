import "./globals.css";

export const metadata = {
  title: { default: "EMS Team", template: "%s · EMS Team" },
  description: "Elite Media Solutions staff workspace",
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: "#0a0a0c" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
