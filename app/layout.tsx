import { SessionProvider } from "next-auth/react";
import "./globals.css";
import { ThemeProvider } from "@/lib/themeContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <body>
        <ThemeProvider>
        <SessionProvider>{children}</SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}