import type { Metadata, Viewport } from "next";
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
  title: "CestomClash228",
  description:
    "Explore. Partage. Level-up. Le moteur de survie géolocalisé de la diaspora étudiante togolaise au Maroc.",
};

// viewportFit: "cover" - prerequis dur pour que env(safe-area-inset-*) se resolve a une
// valeur reelle sur iOS (audit + validation agent Plan du 2026-09-05). Sans ça, tout
// env(safe-area-inset-bottom) ajoute ailleurs (Header.tsx, CityOverview.tsx,
// DetailSheet.tsx) se resoudrait silencieusement a 0px - aucun effet, aucune erreur. Next
// fusionne ce champ avec ses defauts (width/initialScale restent inchanges), verifie dans
// node_modules/next/dist/lib/metadata/default-metadata.js avant d'ajouter ceci.
export const viewport: Viewport = {
  viewportFit: "cover",
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
