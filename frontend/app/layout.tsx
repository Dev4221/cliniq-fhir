import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClinIQ",
  description: "Clinical operations dashboard built on live FHIR R4 data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}