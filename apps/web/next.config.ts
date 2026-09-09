import type { NextConfig } from "next";

// Export statique pour Firebase Hosting (palier gratuit) - toute l'app est
// deja "use client" sans route dynamique/server action/cookie (verifie
// fichier par fichier lors de la refonte 2026-09-09), donc compatible sans
// changement de code. Ne PAS utiliser l'integration "framework" Firebase
// auto-detectee : fermee aux nouveaux projets, redirige vers App Hosting qui
// exige le plan payant Blaze - voir .claude/plans/zesty-knitting-biscuit.md.
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
