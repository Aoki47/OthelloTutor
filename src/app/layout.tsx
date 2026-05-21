import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "年調チェック",
  description: "年末調整PDF解析アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
