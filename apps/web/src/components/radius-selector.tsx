import { MapPin } from "lucide-react";
import { Slider } from "./ui/slider";
import { useHomePageStore } from "@/stores";

export function RadiusSelector({ defaultRadius }: { defaultRadius: number }) {
  const store = useHomePageStore();
  return (
    <div className="rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-sm w-full max-w-3xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            Search Radius
          </span>
        </div>
        <span className="text-sm font-semibold text-primary">
          {store.customUserLocationRadius?.[0] ?? defaultRadius} km
        </span>
      </div>
      <Slider
        defaultValue={[defaultRadius]}
        value={store.customUserLocationRadius}
        onValueChange={store.setCustomUserLocationRadius}
        min={10}
        max={500}
        step={10}
        className="cursor-pointer"
      />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>1 km</span>
        <span>500 km</span>
      </div>
    </div>
  );
}
