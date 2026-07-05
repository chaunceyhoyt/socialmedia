import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "friendspace",
  description: "A very early-2000s social network. Sign in with Google, pick who sees your photos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col site-body">
        <Header />
        <main className="flex-1 w-full max-w-4xl mx-auto px-3 py-6">{children}</main>
        <footer className="text-center text-xs opacity-60 py-6">
          made with nostalgia · your photos live in your own Google Photos account
        </footer>
      </body>
    </html>
  );
}
