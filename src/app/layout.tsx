import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LINE Food Payment",
  description: "Food ordering and QR payment notifications for LINE MINI APP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
