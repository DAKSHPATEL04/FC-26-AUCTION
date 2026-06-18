import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FC 26 Friends Auction Platform",
  description: "Private friend-group IPL-style auction for EA FC 26 fantasy teams",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body 
        className="min-h-full bg-background text-text-primary font-sans flex flex-col"
        suppressHydrationWarning
      >
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#EEEEEE',
              border: '1px solid #333',
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
