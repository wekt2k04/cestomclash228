import type { Metadata } from "next";
import { Chakra_Petch, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { AudioProvider } from "@/lib/audio-context";

const chakraPetch = Chakra_Petch({
  variable: "--font-chakra-petch",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MindClash 228",
  description:
    "Explore. Partage. Level-up. Le moteur de survie géolocalisé de la diaspora étudiante togolaise au Maroc.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${chakraPetch.variable} ${ibmPlexSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <AudioProvider>
          <AuthProvider>{children}</AuthProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
