import { Input } from "./ui/input";
import { Loader, SearchIcon, XIcon } from "lucide-react";
import {
  ChangeEvent,
  KeyboardEvent,
  PropsWithChildren,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useHomePageStore } from "@/stores";
import { Button } from "./ui/button";

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
  }>
) {
  const placeholder = useAnimatePlaceholder();
  const { setQuery, query, resetFilters } = useHomePageStore();
  const [value, setValue] = useState(query ?? "");

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
        <div className="flex flex-col sm:flex-row gap-2 w-full max-w-3xl rounded-2xl bg-white p-2 shadow-2xl backdrop-blur-sm transition-all hover:shadow-glow">
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
              className="rounded-xl flex-1 bg-gradient-to-r from-[hsl(142_45%_35%)] to-[hsl(142_40%_45%)] px-8 font-semibold transition-all hover:scale-102 hover:shadow-lg"
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
        {props.children}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {[
            "Organic farms near me",
            "Grass fed beef",
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
