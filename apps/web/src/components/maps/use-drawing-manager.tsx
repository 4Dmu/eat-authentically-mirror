import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";
import { RefObject, useEffect, useState } from "react";

export type OverlayGeometry =
  | google.maps.Marker
  | google.maps.Polygon
  | google.maps.Polyline
  | google.maps.Rectangle
  | google.maps.Circle;

export interface DrawResult {
  type: google.maps.drawing.OverlayType;
  overlay: OverlayGeometry;
}

export function useDrawingManager(
  initialValue: google.maps.drawing.DrawingManager | null = null
) {
  const map = useMap();
  const drawing = useMapsLibrary("drawing");

  const [drawingManager, setDrawingManager] =
    useState<google.maps.drawing.DrawingManager | null>(initialValue);

  useEffect(() => {
    if (!map || !drawing) return;

    // https://developers.google.com/maps/documentation/javascript/reference/drawing
    const newDrawingManager = new drawing.DrawingManager({
      map,
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        editable: true,
        draggable: true,
      },
    });

    setDrawingManager(newDrawingManager);

    return () => {
      newDrawingManager.setMap(null);
    };
  }, [drawing, map]);

  return drawingManager;
}

type Overlay = google.maps.Polygon;

export function useDrawingManagerEvents(
  drawingManager: google.maps.drawing.DrawingManager | null,
  overlaysShouldUpdateRef: RefObject<boolean>
) {
  const [overlay, setOverlay] = useState<Overlay>();

  useEffect(() => {
    if (!drawingManager) return;

    const eventListeners: Array<google.maps.MapsEventListener> = [];

    const overlayCompleteListener = google.maps.event.addListener(
      drawingManager,
      "overlaycomplete",
      (drawResult: google.maps.drawing.OverlayCompleteEvent) => {
        console.log(drawResult);
        drawingManager.setOptions({
          drawingControl: false,
        });
        drawingManager.setDrawingMode(null);
        setOverlay(drawResult.overlay as google.maps.Polygon);
      }
    );

    eventListeners.push(overlayCompleteListener);

    return () => {
      eventListeners.forEach((listener) =>
        google.maps.event.removeListener(listener)
      );
    };
  }, [drawingManager, overlaysShouldUpdateRef]);

  return overlay;
}
