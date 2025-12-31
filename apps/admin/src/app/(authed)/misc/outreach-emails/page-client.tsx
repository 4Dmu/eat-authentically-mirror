"use client";
import { Button } from "@ea/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ea/ui/card";
import { Separator } from "@ea/ui/separator";
import { useProducerOutreachEmailState } from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import {
  OutreachEmailState,
  OutreachEmailStateList,
} from "@/rpc/outreach-email-state";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ea/ui/table";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { MoreHorizontal } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@ea/ui/dropdown-menu";
import { LIMIT } from "./_shared";
import { useState } from "react";

export const columns: ColumnDef<OutreachEmailState>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "emailStep",
    header: "Emails Sent",
  },
  {
    accessorKey: "lastEmailSent",
    header: "Last Email Sent",
    cell: ({ row }) => {
      return <div>{row.original.lastEmailSent.toDateString()}</div>;
    },
  },
  {
    accessorKey: "nextEmailAt",
    header: "Next Email At",
    cell: ({ row }) => {
      return <div>{row.original.nextEmailAt?.toDateString()}</div>;
    },
  },
  {
    accessorKey: "producerName",
    header: "Name",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const latestEmailId =
        row.original.metadata.runEmailIds[
          row.original.metadata.runEmailIds.length - 1
        ];

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a href={`https://resend.com/emails/${latestEmailId}`}>
                View Latest Email in Resend
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export function ClientPage(props: { emailStates: OutreachEmailStateList }) {
  const [offset, setOffset] = useState(0);
  const outreachEmailStates = useProducerOutreachEmailState(
    { limit: LIMIT, offset: offset },
    {
      initialData: props.emailStates,
    }
  );

  const data = outreachEmailStates.data?.data ?? [];

  const table = useReactTable({
    data: data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: -1,
  });

  return (
    <AppWrapper
      crumbs={[
        { url: "/", name: "EA Admin" },
        { url: "/", name: "Misc" },
      ]}
      end="Outreach Emails"
    >
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>
            <h1>Outreach Emails</h1>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-5">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset - LIMIT)}
              disabled={offset === 0}
            >
              Previous
            </Button>
            <p>{offset / LIMIT + 1}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + LIMIT)}
              disabled={!outreachEmailStates.data?.hasMore}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </AppWrapper>
  );
}
