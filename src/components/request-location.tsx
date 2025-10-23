import { alreadyRequestedGeoAtom, useGeolocationStore } from "@/stores";
import { useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";

export function RequestLocation() {
  const locationStore = useGeolocationStore();
  const setAlready = useSetAtom(alreadyRequestedGeoAtom);

  useEffect(() => {
    setAlready(true);
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

  useEffect(() => {
    console.log(locationStore.state);
  }, [locationStore.state]);

  return null;
}
