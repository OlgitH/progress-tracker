import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StudioLogo from "./ui/logo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resident Progress Tracker",
  description: "A progress tracker app for residents of the Studio in Bath.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header>
          <StudioLogo className="m-4 md:absolute left-0 top-0"/>
          <a href="#main-content" className="skip-link">Skip to main content</a>
        </header>
        {children}
      </body>
    </html>
  );
}
