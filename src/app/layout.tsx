import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: "Deep Environment — Civic Intelligence Platform",
  description: "Crowdsourced environmental intelligence powered by MiniMax 2.1 on Amazon Bedrock",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <div className="scanline-overlay" />
      </body>
    </html>
  );
}
