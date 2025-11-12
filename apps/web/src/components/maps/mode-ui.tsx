import { SelectIcon } from "@radix-ui/react-select";
import {
  ExpandIcon,
  Pentagon,
  PentagonIcon,
  ScaleIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import React, { RefObject, useState } from "react";
import { TerraDraw } from "terra-draw";
import { Button } from "../ui/button";

export default function ModeUI({
  drawRef,
  selectedFeatureId,
}: {
  drawRef: RefObject<TerraDraw | null>;
  selectedFeatureId: string | number | null;
}) {
  const [activeButtonId, setActiveButtonId] = useState("polygon-mode");
  const [resizingEnabled, setResizingEnabled] = useState(false);

  const clickMode = (modeName: string, buttonId: string) => {
    if (!drawRef.current) return;
    console.log(modeName, buttonId);
    drawRef.current.setMode(modeName);
    setActiveButtonId(buttonId);
  };

  const toggleResize = () => {
    if (!drawRef.current) return;
    const newVal = !resizingEnabled;
    setResizingEnabled(newVal);

    drawRef.current.updateModeOptions("select", {
      flags: {
        polygon: {
          feature: {
            draggable: true,
            coordinates: {
              resizable: newVal ? "center" : undefined,
              draggable: !newVal,
            },
          },
        },
      },
    });

    setActiveButtonId("resize-button");
  };

  return (
    <div className="flex gap-3">
      <Button
        size="icon"
        id="polygon-mode"
        variant={activeButtonId === "polygon-mode" ? "secondary" : "default"}
        title="Polygon"
        onClick={() => clickMode("polygon", "polygon-mode")}
      >
        <PentagonIcon />
      </Button>

      <Button
        size="icon"
        id="select-mode"
        variant={activeButtonId === "select-mode" ? "secondary" : "default"}
        title="Select"
        onClick={() => clickMode("select", "select-mode")}
      >
        <SelectIcon />
      </Button>

      <Button
        size="icon"
        id="resize-button"
        variant={activeButtonId === "resize-button" ? "secondary" : "default"}
        className={`mode-button ${activeButtonId === "resize-button" ? "active" : ""}`}
        title="Resize"
        onClick={toggleResize}
      >
        <ExpandIcon />
      </Button>

      <Button
        size="icon"
        id="clear-mode"
        className={`mode-button ${activeButtonId === "clear-mode" ? "active" : ""}`}
        title="Clear"
        onClick={() => {
          if (drawRef.current) {
            drawRef.current.clear();
            drawRef.current.setMode("static");
          }
          setActiveButtonId("clear-mode");
        }}
      >
        <Trash2Icon />
      </Button>

      <Button
        size="icon"
        id="delete-selected-button"
        className={`mode-button ${activeButtonId === "delete-selected-button" ? "active" : ""}`}
        title="Clear last or Selected"
        onClick={() => {
          if (drawRef.current) {
            if (selectedFeatureId) {
              drawRef.current.removeFeatures([selectedFeatureId]);
            } else {
              const features = drawRef.current.getSnapshot();
              if (features.length > 0) {
                const last = features[features.length - 1];
                if (last.id) {
                  drawRef.current.removeFeatures([last.id]);
                }
              }
            }
          }
          setActiveButtonId("delete-selected-button");
        }}
      >
        <TrashIcon />
      </Button>
    </div>
  );
}
