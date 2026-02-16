import { Unbounded, Poppins } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";

const unbounded = Unbounded({
  variable: "--font-primary",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
});

const poppins = Poppins({
  variable: "--font-secondary",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: {
    default: "AnimVox — AI Video & Voice Generation",
    template: "%s — AnimVox",
  },
  description:
    "Create cinematic videos and lifelike voices from text. Fast workflows for creators, teams, and brands.",
  applicationName: "AnimVox",
  keywords: [
    "AnimVox",
    "AI video",
    "text to video",
    "AI voice",
    "text to speech",
    "video generation",
    "creator tools",
  ],
  authors: [{ name: "AnimVox" }],
  creator: "AnimVox",
  category: "technology",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "AnimVox — AI Video & Voice Generation",
    description:
      "Create cinematic videos and lifelike voices from text. Fast workflows for creators, teams, and brands.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AnimVox — AI Video & Voice Generation",
    description:
      "Create cinematic videos and lifelike voices from text. Fast workflows for creators, teams, and brands.",
  },
  themeColor: "#041414",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${unbounded.variable} ${poppins.variable} antialiased`}>
        <Background>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-full focus:bg-black/80 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none focus:ring-2 focus:ring-[#1ba8b1]"
          >
            Skip to content
          </a>
          {children}
        </Background>
      </body>
    </html>
  );
}
