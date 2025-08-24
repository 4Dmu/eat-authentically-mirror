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

  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={props.alt ?? ""} src={url} />;
}
