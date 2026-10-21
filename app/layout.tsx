import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import StudioLogo from "./ui/logo";
import HeaderMenu from "./ui/header-menu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Studio",
  description: "My Studio: goals, progress and social exchanges for residents of The Studio in Bath.",
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
      <body className="min-h-full flex flex-col md:pt-24">
        <header>
          <Link href="/" aria-label="My Studio home" className="m-4 block w-fit md:absolute left-0 top-0">
            <StudioLogo />
          </Link>
          <HeaderMenu className="absolute right-4 top-4 z-30" />
          <a href="#main-content" className="skip-link">Skip to main content</a>
        </header>
        {children}
      </body>
    </html>
  );
}
