import { Header } from "@/components/Header";
import { SocialMap } from "@/components/SocialMap";

export default function HomePage() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <SocialMap />
    </div>
  );
}
