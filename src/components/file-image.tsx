import React, { useEffect, useMemo } from "react";

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

  return <img {...props} src={url} />;
}
