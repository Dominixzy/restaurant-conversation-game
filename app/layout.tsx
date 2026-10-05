import type { Metadata } from "next";
import { Inter, Playfair_Display, Luckiest_Guy } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", weight: ["400", "500", "600", "700"] });
const luckiestGuy = Luckiest_Guy({ subsets: ["latin"], variable: "--font-luckiest-guy", weight: ["400"] });
const avermont = localFont({ src: "../public/fonts/AvermontHouse_PERSONAL_USE_ONLY.otf", variable: "--font-avermont" });
const roasted = localFont({ src: "../public/fonts/RoastedKetchup.ttf", variable: "--font-roasted" });

export const metadata: Metadata = {
  title: "RESTAURANT - English Game",
  description: "Learn English conversation through restaurant scenarios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} ${avermont.variable} ${roasted.variable} ${luckiestGuy.variable} font-sans antialiased bg-stone-50 text-stone-900 min-h-screen overflow-x-hidden selection:bg-amber-200`}>
        {children}
      </body>
    </html>
  );
}
