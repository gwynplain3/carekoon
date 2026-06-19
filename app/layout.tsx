import type { Metadata } from "next";
import { Inter, Sarabun } from "next/font/google";
import { UserProvider } from "@/lib/context/UserProvider";
import AuthGate from "@/components/auth/AuthGate";
import FontSizeProvider from "@/components/settings/FontSizeProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const sarabun = Sarabun({ 
  subsets: ["thai", "latin"], 
  weight: ['300', '400', '500', '700', '800'],
  variable: "--font-sarabun" 
});

export const metadata: Metadata = {
  title: "Care คุณ - บันทึกสุขภาพผู้สูงอายุ",
  description: "แอปพลิเคชันช่วยดูแลสุขภาพและกิจวัตรประจำวันสำหรับผู้สูงอายุ",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" data-scroll-behavior="smooth" className={`${inter.variable} ${sarabun.variable}`}>
      <body style={{ fontFamily: 'var(--font-sarabun), var(--font-inter), sans-serif' }}>
        <UserProvider>
          <FontSizeProvider>
            <AuthGate>{children}</AuthGate>
          </FontSizeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
