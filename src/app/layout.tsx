import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "ECHO//SHIFT — Temporal Research Division",
  description: "Your past remains. Cooperate with it. A session-based temporal puzzle game.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
