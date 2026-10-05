import type { Metadata } from "next";
import { Lato } from "next/font/google";
import "./globals.css";

// Lato is the typeface Slack uses for its message composer.
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Thoughts",
  description: "Personal journal for notes and connected thoughts",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${lato.variable} h-full antialiased`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
