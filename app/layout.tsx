import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import ChatProvider from "@/components/ChatProvider";

export const metadata: Metadata = {
  title: "Infinity Fund",
  description: "AFL & NRL Sports Betting Fund Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>{`
          @media (max-width: 768px) {
            main {
              padding-left: 0 !important;
            }
          }
        `}</style>
      </head>
      <body style={{ background: "var(--background)", color: "var(--text-primary)" }}>
        <Nav />
        <ChatProvider>
          <main style={{ paddingLeft: "240px", minHeight: "100vh" }}>
            {children}
          </main>
        </ChatProvider>
      </body>
    </html>
  );
}
