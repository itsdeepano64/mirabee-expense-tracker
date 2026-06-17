import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mirabee Expenses",
  description: "Expense tracking for Mirabee Flowers",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Mirabee Expenses",
  },
};

export const viewport: Viewport = {
  themeColor: "#4AACC4",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <head>
        {/* Apply saved theme before first paint — prevents flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mirabee-theme');if(t&&t!=='default')document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full w-full flex flex-col">
        {children}
        <Toaster position="bottom-center" richColors offset="80px" />
      </body>
    </html>
  );
}