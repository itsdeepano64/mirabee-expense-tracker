import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
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
  themeColor: "#6BA8BA",
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
      <body className="min-h-full w-full flex flex-col">
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}