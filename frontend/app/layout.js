import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../lib/i18n";
import Navbar from "../components/Navbar";
import SOSButton from "../components/SOSButton";
import ChatbotWidget from "../components/ChatbotWidget";

export const metadata = {
  title: "CityCare — Hospitals & Pharmacy, on demand",
  description: "Find hospitals, book doctors, order medicines and get emergency help — all in one app.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
            <SOSButton />
            <ChatbotWidget />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
