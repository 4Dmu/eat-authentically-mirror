"use client";
import type { ProducerSearchResultRow } from "@ea/search";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@ea/ui/alert-dialog";
import { Button } from "@ea/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@ea/ui/dropdown-menu";
import { Input } from "@ea/ui/input";
import { Skeleton } from "@ea/ui/skeleton";
import type { ColumnDef } from "@tanstack/react-table";
import { useThrottle } from "@uidotdev/usehooks";
import { MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRemoveProducer, useSearchProducers } from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import { DataTable } from "@/components/data-table";

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
        <Link className="underline" href={`/producers/${row.original.id}`}>
          {row.original.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "id",
    header: "Id",
    cell: ({ row }) => {
      return <p className="break-all">{row.original.id}</p>;
    },
  },
  {
    accessorKey: "userId",
    header: "User Id",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original;
      const removeProducer = useRemoveProducer({
        onSuccess: () => toast.success("Producer deleted successfully"),
        onError: (e) => {
          console.log(e);
          toast.error("Error deleting producer", {
            description: e.message,
          });
        },
      });

      return (
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(document.id)}
              >
                Copy producer ID
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (document.userId) {
                    navigator.clipboard.writeText(document.userId);
                  } else {
                    navigator.clipboard.writeText("null");
                  }
                }}
              >
                Copy producer userId
              </DropdownMenuItem>

              <AlertDialogTrigger asChild disabled={removeProducer.isPending}>
                <DropdownMenuItem>Delete Producer</DropdownMenuItem>
              </AlertDialogTrigger>

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/producers/${row.original.id}`}>
                  View producer
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                producer, it will not delete the user it may be associated with
                or other producers associated with that user.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={removeProducer.isPending}
                variant={"destructive"}
                onClick={() =>
                  removeProducer.mutate({ producerId: document.id })
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    },
  },
];

export default function Page() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const throttledQuery = useThrottle(query, 500);

  const results = useSearchProducers({ page: page, query: throttledQuery });

  const removeProducer = useRemoveProducer({
    onSuccess: async () => {
      await results.refetch();
    },
    onError: (e) => {
      console.log(e);
      toast.error("Error deleting producer", {
        description: e.message,
      });
    },
  });

  const columns = useMemo<ColumnDef<ProducerSearchResultRow>[]>(
    () => [
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
            <Link className="underline" href={`/producers/${row.original.id}`}>
              {row.original.name}
            </Link>
          );
        },
      },
      {
        accessorKey: "id",
        header: "Id",
        cell: ({ row }) => {
          return <p className="break-all">{row.original.id}</p>;
        },
      },
      {
        accessorKey: "userId",
        header: "User Id",
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const document = row.original;

          return (
            <AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(document.id)}
                  >
                    Copy producer ID
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (document.userId) {
                        navigator.clipboard.writeText(document.userId);
                      } else {
                        navigator.clipboard.writeText("null");
                      }
                    }}
                  >
                    Copy producer userId
                  </DropdownMenuItem>

                  <AlertDialogTrigger
                    asChild
                    disabled={removeProducer.isPending}
                  >
                    <DropdownMenuItem>Delete Producer</DropdownMenuItem>
                  </AlertDialogTrigger>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/producers/${row.original.id}`}>
                      View producer
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    this producer, it will not delete the user it may be
                    associated with or other producers associated with that
                    user.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={removeProducer.isPending}
                    variant={"destructive"}
                    onClick={() => {
                      const promise = removeProducer.mutateAsync({
                        producerId: document.id,
                      });
                      toast.promise(promise, {
                        loading: "Deleting producer",
                        success: "Producer deleted successfully",
                      });
                    }}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        },
      },
    ],
    [removeProducer],
  );

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
