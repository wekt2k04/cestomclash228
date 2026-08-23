import { Header } from "@/components/Header";
import { CityOverview } from "@/components/CityOverview";

export default function HomePage() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <CityOverview />
    </div>
  );
}
