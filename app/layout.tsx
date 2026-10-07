import type { Metadata, Viewport } from "next";
import { LoadingWrapper } from "@/components/common/LoadingWrapper";
import "./globals.css";

export const metadata: Metadata = {
  title: "CostCalc — AI Project Cost Estimator",
  description:
    "Describe your project and get a localized cost range, detailed scope, timeline and professional quotation in minutes.",
  keywords: [
    "project cost estimator",
    "AI cost estimation",
    "website cost calculator",
    "project quotation",
  ],
  openGraph: {
    title: "CostCalc — AI Project Cost Estimator",
    description:
      "Get a clear, localized cost estimate and professional quotation for your next project.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d1a25",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LoadingWrapper>{children}</LoadingWrapper>
      </body>
    </html>
  );
}
