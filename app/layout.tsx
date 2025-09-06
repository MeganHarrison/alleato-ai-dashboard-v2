import React, { type ReactElement } from "react";
import type { Metadata } from "next";
import "./globals.css";
import "@/components/docs/documentation-styles.css";

export const metadata: Metadata = {
  title: "Alleato - AI Intelligence",
  description: "Transform your data into powerful insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): ReactElement {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased bg-white">
        {children}
      </body>
    </html>
  );
}
