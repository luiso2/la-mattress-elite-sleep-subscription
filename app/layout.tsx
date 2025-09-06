import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LA Mattress Elite Sleep+ | Member Portal",
  description: "Access your exclusive LA Mattress Elite Sleep+ member benefits including $180 annual store credit, free delivery, and lifetime warranty protection",
  icons: {
    icon: '/favicon.jpg',
    shortcut: '/favicon.jpg',
    apple: '/favicon.jpg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}