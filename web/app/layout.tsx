import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Literata, Roboto_Flex } from "next/font/google";
import { I18nProvider } from "@/lib/i18n";
import "./globals.css";

const robotoFlex = Roboto_Flex({
  variable: "--font-roboto-flex",
  subsets: ["latin", "greek"],
  axes: ["wdth"], // condensed titles (font-stretch)
  display: "swap",
});
const literata = Literata({
  variable: "--font-literata",
  subsets: ["latin", "greek"],
  display: "swap",
});
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin", "greek"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chloris",
  description: "Where Greece's medicinal plants grow, which are at risk, and how we keep them.",
};

export const viewport: Viewport = {
  themeColor: "#0B1410",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${robotoFlex.variable} ${literata.variable} ${jetbrainsMono.variable} antialiased`}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
