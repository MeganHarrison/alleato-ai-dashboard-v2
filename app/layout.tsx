import { AIChat } from "@/components/ai-chat";
import "@/components/docs/documentation-styles.css";
import type { Metadata } from "next";
import React, { type ReactElement } from "react";
import "./globals.css";

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
      <body className="font-sans antialiased bg-white pb-6">
        {children}
        <AIChat />
      </body>
    </html>
  );
}
