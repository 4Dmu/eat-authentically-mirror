import React, { useEffect, useMemo } from "react";

export function FileVideo({
  file,
  ...props
}: { file: File } & Omit<React.ComponentProps<"video">, "src" | "ref">) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [url]);

  return <video {...props} src={url} />;
}
