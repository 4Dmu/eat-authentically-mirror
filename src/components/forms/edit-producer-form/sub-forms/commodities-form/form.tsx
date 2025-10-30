import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defaultOptions, withForm } from "./context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCallback, useEffect, useRef, useState } from "react";
import { useListCommodoties } from "@/utils/producers";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useMeasure } from "@uidotdev/usehooks";
import { setQuarter } from "date-fns";

function isProducerCommodity(
  value:
    | {
        producerId: string;
        commodityId: number;
        variantId: number | null;
        organic: boolean;
        certifications: string[] | null;
        seasonMonths: string | null;
        updatedAt: Date;
      }
    | {
        name: string;
      }
): value is {
  producerId: string;
  commodityId: number;
  variantId: number | null;
  organic: boolean;
  certifications: string[] | null;
  seasonMonths: string | null;
  updatedAt: Date;
} {
  return Object.hasOwn(value, "commodityId");
}

export const Form = withForm({
  ...defaultOptions,
  render: function Render({ form }) {
    const [query, setquery] = useState("");
    const [open, setOpen] = useState(false);
    const [ref, { width, height }] = useMeasure();

    const commodoties = useListCommodoties();

    return (
      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>List the products of your farm.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {
            <form.Field name="commodities" mode="array">
              {(field) => (
                <>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        ref={ref}
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                      >
                        Find or create products...
                        <ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      style={{ width: width ?? undefined }}
                      className="p-0"
                    >
                      <Command
                        filter={(value, search) => {
                          if (
                            value.toLowerCase().includes(search.toLowerCase())
                          )
                            return 1;
                          return 0;
                        }}
                      >
                        <CommandInput
                          value={query}
                          onValueChange={setquery}
                          placeholder="Search framework..."
                        />
                        <CommandList>
                          <CommandEmpty>
                            No commodity found.{" "}
                            <Button
                              onClick={() => {
                                if (
                                  !field.state.value.some((i) =>
                                    isProducerCommodity(i)
                                      ? false
                                      : i.name === query
                                  )
                                ) {
                                  field.pushValue({
                                    name: query,
                                  });
                                }
                                setOpen(false);
                              }}
                            >
                              Create
                            </Button>
                          </CommandEmpty>
                          <CommandGroup>
                            {commodoties.data?.map((framework) => (
                              <CommandItem
                                key={framework.id}
                                value={framework.name}
                                onSelect={() => {
                                  if (
                                    !field.state.value.some((i) =>
                                      isProducerCommodity(i)
                                        ? i.commodityId === framework.id
                                        : false
                                    )
                                  ) {
                                    field.pushValue({
                                      producerId: "",
                                      commodityId: framework.id,
                                      variantId: null,
                                      organic: false,
                                      certifications: null,
                                      seasonMonths: null,
                                      updatedAt: new Date(),
                                    });
                                  }
                                  setOpen(false);
                                }}
                              >
                                {framework.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-3">
                    {field.state.value.map((comm, i) => (
                      <div className="relative" key={i}>
                        <Badge>
                          {isProducerCommodity(comm)
                            ? commodoties.data?.find(
                                (c) => c.id === comm.commodityId
                              )?.name
                            : comm.name}
                        </Badge>
                        <Button
                          onClick={() => field.removeValue(i)}
                          className="absolute -top-1 -right-2 size-4 rounded-full"
                          variant={"destructive"}
                          size={"icon"}
                        >
                          <XIcon size={3} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </form.Field>
          }
        </CardContent>
      </Card>
    );
  },
});
