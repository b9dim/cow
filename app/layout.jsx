import "./globals.css";
export const metadata = {
  title: "CONCORD | Logo Showcase",
  description: "This art concords naturally into a balanced, harmonious symbol that reflects the values of architectural planning.",
  manifest: "/site.webmanifest",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-[#3d4a5d] text-white antialiased">
        {children}
      </body>
    </html>
  );
}


