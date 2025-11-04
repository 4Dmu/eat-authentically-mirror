import React, { ComponentProps, useRef } from "react";
import { Button } from "./ui/button";
import {
  FileInput,
  FileInputProps,
  SingleFileInput,
  SingleFileInputProps,
} from "./file-input";

export function SelectFileButton({
  file,
  onChange,
  mimeType,
  children,
  variant,
  size,
  className,
  onSelectFileToLarge,
  maxFileSize,
}: Pick<SingleFileInputProps, "file" | "onChange" | "mimeType" | "children"> &
  Pick<ComponentProps<typeof Button>, "variant" | "className" | "size"> & {
    onSelectFileToLarge?: () => void;
    maxFileSize: number;
  }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <SingleFileInput
        ref={inputRef}
        className="hidden"
        mimeType={mimeType}
        file={file}
        onChange={(e) => {
          if (e && e.size < maxFileSize) {
            onChange(e);
          } else if (e) {
            onSelectFileToLarge?.();
          } else {
            onChange(e);
          }
        }}
      />
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={() => inputRef.current?.click()}
      >
        {children}
      </Button>
    </div>
  );
}

export function TemporyFilesSelectButton({
  children,
  mimeType,
  maxFiles,
  onSelect,
  onSelectMoreFilesThanAllowed,
}: {
  onSelect: (files: File[]) => void;
} & Pick<
  FileInputProps,
  "mimeType" | "children" | "maxFiles" | "onSelectMoreFilesThanAllowed"
>) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <FileInput
        multiple={true}
        ref={inputRef}
        files={[]}
        onSelectMoreFilesThanAllowed={onSelectMoreFilesThanAllowed}
        onChange={(e) => {
          onSelect(e);
        }}
        className="hidden"
        mimeType={mimeType}
        maxFiles={maxFiles}
      />
      <Button onClick={() => inputRef.current?.click()}>{children}</Button>
    </div>
  );
}

export function TemporyFileSelectButton({
  children,
  mimeType,
  onSelect,
  onSelectFileToLarge,
  maxFileSize,
}: {
  onSelect: (files: File) => void;
  onSelectFileToLarge?: () => void;
  maxFileSize: number;
} & Pick<SingleFileInputProps, "mimeType" | "children"> &
  Pick<ComponentProps<typeof Button>, "variant" | "className" | "size">) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <SingleFileInput
        ref={inputRef}
        file={undefined}
        onChange={(e) => {
          if (e && e.size < maxFileSize) {
            onSelect(e);
          } else if (e) {
            onSelectFileToLarge?.();
          }
        }}
        className="hidden"
        mimeType={mimeType}
      />
      <Button onClick={() => inputRef.current?.click()}>{children}</Button>
    </div>
  );
}
