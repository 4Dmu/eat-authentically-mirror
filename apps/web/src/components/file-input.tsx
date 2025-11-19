import type React from "react";
import { type ComponentProps, useEffect } from "react";
import { Input } from "@ea/ui/input";

export type FileInputProps = {
  files: File[];
  onChange(files: File[]): void;
  maxFiles: number;
  mimeType: string;
  ref: React.RefObject<HTMLInputElement | null>;
  onSelectMoreFilesThanAllowed?: () => void;
} & Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "onChange" | "ref" | "max" | "maxLength" | "accept"
>;

export function FileInput({
  files,
  maxFiles,
  mimeType,
  onChange,
  ref,
  onSelectMoreFilesThanAllowed,
  ...rest
}: FileInputProps) {
  useEffect(() => {
    if (ref.current) {
      const dataTransfer = new DataTransfer();
      files.slice(0, maxFiles).forEach((file) => {
        dataTransfer.items.add(file);
      });
      ref.current.files = dataTransfer.files;
    }
  }, [files, maxFiles, ref]);

  return (
    <Input
      {...rest}
      ref={ref}
      accept={mimeType}
      type="file"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = [...(e.target.files ?? [])];
        const filteredFileList = fileList
          .slice(0, maxFiles)
          .filter((f) =>
            mimeType.endsWith("*")
              ? f.type.split("/")[0] === mimeType.split("/")[0]
              : f.type === mimeType
          );

        if (files.length >= maxFiles) {
          onSelectMoreFilesThanAllowed?.();
        }

        onChange(filteredFileList);
      }}
    />
  );
}

export type SingleFileInputProps = {
  file: File | undefined;
  onChange(file: File | undefined): void;
  mimeType: string;
  ref: React.RefObject<HTMLInputElement | null>;
} & Omit<
  ComponentProps<typeof Input>,
  | "type"
  | "value"
  | "onChange"
  | "ref"
  | "max"
  | "maxLength"
  | "accept"
  | "multiple"
>;

export function SingleFileInput({
  file,
  mimeType,
  onChange,
  ref,
  ...rest
}: SingleFileInputProps) {
  useEffect(() => {
    if (ref.current) {
      const dataTransfer = new DataTransfer();
      if (file) {
        dataTransfer.items.add(file);
      }
      ref.current.files = dataTransfer.files;
    }
  }, [file, ref]);

  return (
    <Input
      {...rest}
      multiple={false}
      ref={ref}
      accept={mimeType}
      type="file"
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.currentTarget.files;
        const newFile = fileList?.item(0) ?? undefined;

        if (
          mimeType.endsWith("*")
            ? newFile?.type.split("/")[0] === mimeType.split("/")[0]
            : newFile?.type === mimeType
        ) {
          onChange(newFile);
        } else {
          onChange(undefined);
        }
      }}
    />
  );
}
