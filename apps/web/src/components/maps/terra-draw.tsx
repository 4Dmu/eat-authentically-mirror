import { RefObject, useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawPolygonMode,
} from "terra-draw";
import { TerraDrawGoogleMapsAdapter } from "terra-draw-google-maps-adapter";

export function TerraDrawLayer({
  drawRef,
  setSelectedFeatureId,
}: {
  drawRef: RefObject<TerraDraw | null>;
  setSelectedFeatureId: (value: string | number | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (drawRef.current) return;

    const listeners: google.maps.MapsEventListener[] = [];
    let pollInterval = null;
    let stopped = false;
    let draw = null;

    const init = () => {
      try {
        const realDiv = map.getDiv && map.getDiv();
        if (!realDiv) return false;
        if (!document.body.contains(realDiv)) return false;
        if (!realDiv.id) {
          realDiv.id = "gmaps-terra-draw-root";
        }

        const adapter = new TerraDrawGoogleMapsAdapter({
          map,
          lib: window.google?.maps,
          coordinatePrecision: 9,
        });

        draw = new TerraDraw({
          adapter,
          modes: [
            new TerraDrawSelectMode({
              flags: {
                polygon: {
                  feature: {
                    draggable: true,
                    rotateable: true,
                    coordinates: {
                      midpoints: true,
                      draggable: true,
                      deletable: true,
                    },
                  },
                },
              },
            }),
            new TerraDrawPolygonMode({
              editable: true,
              styles: { fillColor: "#E74C3C", outlineColor: "#FF5722" },
            }),
          ],
        });

        draw.start();

        draw.on("select", (id) => {
          if (setSelectedFeatureId) setSelectedFeatureId(id);
        });

        draw.on("deselect", () => {
          if (setSelectedFeatureId) setSelectedFeatureId(null);
        });

        drawRef.current = draw;
        return true;
      } catch (err) {
        console.error("Error initializing TerraDrawLayer:", err);
        return false;
      }
    };

    if (!init()) {
      listeners.push(
        map.addListener("projection_changed", () => {
          if (stopped) return;
          init();
        })
      );
      listeners.push(
        map.addListener("idle", () => {
          if (stopped) return;
          init();
        })
      );
      pollInterval = setInterval(() => {
        if (stopped) return;
        init();
      }, 100);
    }

    return () => {
      stopped = true;
      listeners.forEach((l) => {
        try {
          google.maps.event.removeListener(l);
        } catch (e) {}
      });
      if (pollInterval) clearInterval(pollInterval);
      if (drawRef.current) {
        try {
          drawRef.current.stop();
        } catch (e) {
          console.warn(e);
        }
        drawRef.current = null;
      }
    };
  }, [map, drawRef, setSelectedFeatureId]);

  return null;
}
