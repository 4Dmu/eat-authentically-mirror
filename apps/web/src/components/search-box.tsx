import { Input } from "@ea/ui/input";
import { Loader, SearchIcon, XIcon } from "lucide-react";
import {
  ChangeEvent,
  Fragment,
  KeyboardEvent,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useHomePageStore } from "@/stores";
import { Button } from "@ea/ui/button";
import { Separator } from "@ea/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@ea/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { COUNTRIES } from "@/utils/contries";
import { Label } from "@ea/ui/label";
import { useCertificationTypes, useProducerCountries } from "@/utils/producers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@ea/ui/dropdown-menu";
import { LocationSelect } from "./custom-location-select";

const placeholders = [
  "Find me a farm to table eatery in Florence...",
  "Restaurants in paris...",
  "Farms in kentucky...",
];

function useAnimatePlaceholder() {
  const [index, setIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    let place = "";
    const typingInterval = setInterval(() => {
      if (place.length < placeholders[index].length) {
        place += placeholders[index][place.length];
        setPlaceholder(place);
      } else {
        clearInterval(typingInterval);
        const deletingInterval = setInterval(() => {
          if (place.length > 0) {
            place = place.slice(0, place.length - 1);
            setPlaceholder(place);
          } else {
            clearInterval(deletingInterval);
            setIndex((index + 1) % placeholders.length);
          }
        }, 100);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, [index]);

  return placeholder;
}

export function SearchBox(
  props: PropsWithChildren<{
    after?: ReactNode | undefined;
    isSearching?: boolean;
    userRequestsUsingTheirLocation?: boolean;
  }>
) {
  const placeholder = useAnimatePlaceholder();
  const {
    setQuery,
    query,
    resetFilters,
    countryFilter: country,
    setCountryFilter: setCountry,
    certsFilter: certs,
    setCertsFilter: setCerts,
    categoryFilter: typeFilter,
    setCategoryFilter: setTypeFilter,
    locationSearchArea,
  } = useHomePageStore();
  const [value, setValue] = useState(query ?? "");
  const producerCountries = useProducerCountries();
  const certsQuery = useCertificationTypes();

  const countries = COUNTRIES.filter((c) =>
    producerCountries.data?.some((cr) => c.alpha3 === cr)
  );

  function updateQuery(e: ChangeEvent<HTMLInputElement>) {
    setValue(e.currentTarget.value);
  }

  function handleSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      setQuery(value);
    }
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full -translate-y-1/2">
      <div className="p-5 flex flex-col gap-5 items-center text-center">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg md:text-7xl lg:text-8xl">
          Eat Authentically
        </h1>
        <p className="max-w-2xl text-lg text-white/95 drop-shadow-md md:text-xl">
          Discover farm-to-table experiences, local ranches, and authentic
          eateries
        </p>
        <div className="flex flex-col gap-2 w-full max-w-3xl rounded-2xl bg-white p-2 shadow-2xl backdrop-blur-sm transition-all hover:shadow-glow">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex flex-1 items-center gap-3 px-4">
              {props.isSearching ? (
                <Loader className="animate-spin text-primary h-5 w-5" />
              ) : (
                <SearchIcon className="h-5 w-5 text-muted-foreground" />
              )}
              <Input
                type="text"
                placeholder={placeholder}
                onKeyDown={handleSubmit}
                value={value}
                onChange={updateQuery}
                className="typewrite-placeholder border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              />
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                size="lg"
                onClick={() => setQuery(value)}
                className="rounded-xl flex-1 bg-linear-to-r from-[hsl(142_45%_35%)] to-[hsl(142_40%_45%)] px-8 font-semibold transition-all hover:scale-102 hover:shadow-lg"
              >
                Search
              </Button>
              {query !== undefined && (
                <Button
                  onClick={() => {
                    setQuery(undefined);
                    setValue("");
                    resetFilters();
                  }}
                  variant={"secondary"}
                  size={"lg"}
                  className="self-center rounded-xl hover:scale-105 hover:shadow-lg"
                >
                  <XIcon className="" />
                </Button>
              )}
            </div>
          </div>
          {query && (
            <div className="flex flex-col gap-3 pt-3 px-2">
              <Separator />
              <div className="flex flex-wrap p-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Type</Label>
                  <div className="relative">
                    <Select
                      value={typeFilter === undefined ? "none" : typeFilter}
                      onValueChange={(v) =>
                        setTypeFilter(v === "none" ? undefined : (v as "farm"))
                      }
                    >
                      <SelectTrigger className="">
                        <SelectValue placeholder={"Farm..."} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="farm">Farm</SelectItem>
                        <SelectItem value="ranch">Ranch</SelectItem>
                        <SelectItem value="eatery">Eatery</SelectItem>
                      </SelectContent>
                    </Select>
                    {typeFilter && (
                      <div className="absolute -top-1 -left-1 flex items-center justify-center bg-secondary p-1.5 text-white rounded-full"></div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Country</Label>
                  {countries.length > 0 && (
                    <div className="flex gap-2 relative">
                      <Select
                        value={country === undefined ? "none" : country}
                        onValueChange={(v) =>
                          setCountry(v === "none" ? undefined : v)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          <SelectItem key={"none"} value={"none"}>
                            None
                          </SelectItem>
                          {countries.map((country) => (
                            <SelectItem
                              key={country.alpha3}
                              value={country.alpha3}
                            >
                              {country.aliases?.[0] ?? country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {country && (
                        <div className="absolute -top-1 -left-1 flex items-center justify-center bg-secondary p-1.5 text-white rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Certifications</Label>
                  <DropdownMenu>
                    <div className="relative">
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="font-normal max-w-40"
                        >
                          <span className="truncate">
                            {certs.map((c, i) => (
                              <Fragment key={c.id}>
                                {c.name}
                                {i < certs.length - 1 && ", "}
                              </Fragment>
                            ))}
                            {certs.length == 0 && <span>Select certs</span>}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      {certs.length > 0 && (
                        <div className="absolute -top-1 -left-1 flex items-center justify-center bg-secondary p-1.5 text-white rounded-full"></div>
                      )}
                    </div>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>Certifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {certsQuery.data?.map((cert) => (
                        <DropdownMenuCheckboxItem
                          className="flex gap-2"
                          key={cert.id}
                          checked={certs.some((c) => cert.id === c.id)}
                          onCheckedChange={(e) => {
                            if (e === true) {
                              setCerts([
                                ...certs,
                                {
                                  name: cert.name,
                                  id: cert.id,
                                  mustBeVerified: false,
                                },
                              ]);
                            } else {
                              setCerts([
                                ...certs.filter((c) => c.id !== cert.id),
                              ]);
                            }
                          }}
                        >
                          <Label htmlFor={cert.name} className="capitalize">
                            {cert.name}
                          </Label>
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs">Map Area</Label>
                  <div className="relative">
                    <LocationSelect
                      disabled={props.userRequestsUsingTheirLocation ?? false}
                    />
                    {locationSearchArea && (
                      <div className="absolute -top-1 -left-1 flex items-center justify-center bg-secondary p-1.5 text-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        {props.children}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "Organic farms near me",
            "Organic turkey",
            "Farm to table restaurant",
          ].map((example) => (
            <button
              key={example}
              onClick={() => {
                setValue(example);
                setQuery(example);
              }}
              className="rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/30"
            >
              {example}
            </button>
          ))}
        </div>
        {props.after}
      </div>
    </div>
  );
}
