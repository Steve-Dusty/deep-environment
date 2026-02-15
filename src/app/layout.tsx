import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: "Deep Environment — Environmental Intelligence Platform",
  description: "Real-time environmental threat monitoring and multi-agent analysis",
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
