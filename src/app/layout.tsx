import type { Metadata } from "next";
import { Lato, Oswald } from "next/font/google";
import "./globals.css";

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "SF Winner - Team Manager",
  description: "SF Winner Sports Club Team Manager Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${lato.variable} ${oswald.variable} min-h-screen bg-light`}>
        {children}
      </body>
    </html>
  );
}