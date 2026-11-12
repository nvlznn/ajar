import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Ajar", template: "%s · Ajar" },
  description: "所有你能申請的機會，依截止日排好。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
