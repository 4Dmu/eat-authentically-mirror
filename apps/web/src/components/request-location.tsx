import { useGeolocationStore } from "@/stores";
import { useEffect } from "react";

export function RequestLocation() {
  const locationStore = useGeolocationStore();

  // biome-ignore lint/correctness/useExhaustiveDependencies: Ignore bad dependency
  useEffect(() => {
    if (navigator.geolocation) {
      locationStore.setLocationSupported(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          locationStore.setPosition(position);
        },
        (err) => {
          locationStore.setPositionError(err);
        },
        {}
      );
    } else {
      locationStore.setLocationSupported(false);
    }
  }, []);

  return null;
}
