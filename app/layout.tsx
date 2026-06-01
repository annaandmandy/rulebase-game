import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "山霧旅館",
  description: "中文規則怪談互動敘事遊戲",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-neutral-950">{children}</body>
    </html>
  );
}
