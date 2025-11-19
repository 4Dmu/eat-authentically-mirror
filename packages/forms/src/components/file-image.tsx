import type React from "react";
import { useEffect, useMemo } from "react";

export function FileImage({
  file,
  ...props
}: { file: File } & Omit<React.ComponentProps<"img">, "src" | "ref">) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  // biome-ignore  lint/performance/noImgElement: Dont want next to cache file image
  return <img {...props} alt={props.alt ?? ""} src={url} />;
}
