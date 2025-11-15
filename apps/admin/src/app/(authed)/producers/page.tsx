"use client";
import { useCreateProducer, useSearchProducers } from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import { FieldInfo } from "@/components/forms/helpers/field-info";
import { PRODUCER_TYPES } from "@ea/shared/constants";
import { Button } from "@ea/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ea/ui/card";
import { Input } from "@ea/ui/input";
import { Label } from "@ea/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ea/ui/select";
import { Textarea } from "@ea/ui/textarea";
import {
  registerProducerArgsValidator,
  type ProducerTypes,
} from "@ea/validators/producers";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { Skeleton } from "@ea/ui/skeleton";
import { ProducerSearchResultRow } from "@ea/search";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table";
import Link from "next/link";
import { useThrottle } from "@uidotdev/usehooks";

export const columns: ColumnDef<ProducerSearchResultRow>[] = [
  {
    accessorKey: "coverUrl",
    header: "Cover",
    cell: ({ row }) => {
      return (
        <>
          {row.original.coverUrl ? (
            <Image
              className="size-12 object-cover rounded-lg"
              alt="cover"
              width={300}
              height={300}
              src={row.original.coverUrl}
            />
          ) : (
            <Skeleton className="size-12 object-cover flex justify-center items-center text-center">
              <p>
                No
                <br />
                Image
              </p>
            </Skeleton>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => {
      return (
        <>
          <Link className="underline" href={`/producers/${row.original.id}`}>
            {row.original.name}
          </Link>
        </>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Id",
  },
  {
    accessorKey: "userId",
    header: "User Id",
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const throttledQuery = useThrottle(query, 500);
  const results = useSearchProducers({ page: page, query: throttledQuery });
  return (
    <AppWrapper crumbs={[{ url: "/", name: "EA Admin" }]} end="Producers">
      <div className="flex justify-center p-10">
        <div className="flex flex-col w-full gap-5">
          <h1 className="font-bold text-2xl">List Producers</h1>
          <div>
            <Input
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
          </div>
          <DataTable
            page={page}
            setPage={setPage}
            rowCount={results.data?.found}
            columns={columns}
            data={results.data?.hits?.map((h) => h.document) ?? []}
          />
          {/* <div className="flex flex-col gap-10">
            <p>{results.data?.found}</p>
            <div className="flex flex-col gap-3">
              {results.data?.hits?.map((hit) => (
                <div
                  key={hit.document.id}
                  className="flex gap-2 border p-1 rounded-lg bg-muted"
                >
                  {hit.document.coverUrl ? (
                    <Image
                      className="size-12 object-cover rounded-lg"
                      alt="cover"
                      width={300}
                      height={300}
                      src={hit.document.coverUrl}
                    />
                  ) : (
                    <Skeleton className="size-12 object-cover">
                      <p>No Image</p>
                    </Skeleton>
                  )}
                  <p className="font-bold">{hit.document.name}</p>
                </div>
              ))}
            </div>
          </div> */}
        </div>
      </div>
    </AppWrapper>
  );
}
