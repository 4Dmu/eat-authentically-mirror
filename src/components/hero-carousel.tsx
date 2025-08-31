import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from "./ui/input";
import { CompassIcon } from "lucide-react";
import { PRODUCER_TYPES } from "@/backend/validators/producers";
import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useHomePageStore } from "@/stores";
import Image from "next/image";

const slides = [
  {
    id: "food",
    imageUrl: "/hero/FRF_Food.png",
    filter: undefined,
    title: "Eat Authentically",
  },
  {
    id: "farm",
    imageUrl: "/hero/FRF_Farm_Default.jpg",
    filter: "farm",
    title: "Authentic Farms",
  },
  {
    id: "ranch",
    imageUrl: "/hero/FRF_Ranch_Default.jpg",
    filter: "ranch",
    title: "Authentic Ranches",
  },
  {
    id: "eatery",
    imageUrl: "/hero/FRF_Eaterie_Default.jpg",
    filter: "eatery",
    title: "Authentic Eateries",
  },
];

function SearchBox({ title }: { title: string }) {
  const { setQuery, query } = useHomePageStore();

  function updateQuery(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.currentTarget.value == "" ? undefined : e.currentTarget.value);
  }

  function handleSubmit(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && query) {
      window.scroll({ top: window.innerHeight, behavior: "smooth" });
    }
  }

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-full -translate-y-1/2">
      <div className="p-5 flex flex-col gap-10 items-center text-center">
        <h1 className="font-bold text-6xl text-white text-shadow-lg">
          {title}
        </h1>
        <div className="flex w-full relative max-w-xl">
          <CompassIcon className="absolute text-muted-foreground top-1/2 -translate-y-1/2 left-5" />
          <Input
            onKeyDown={handleSubmit}
            value={query ?? ""}
            onChange={updateQuery}
            className="bg-white p-10 rounded-full text-base md:text-2xl pl-13 focus-visible:border-black focus-visible:ring-black"
            placeholder="Search farms, ranches, eatieries..."
          />
        </div>
      </div>
    </div>
  );
}

export function HeroCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const setTypeFilter = useHomePageStore((s) => s.setTypeFilter);

  const handler = useCallback(() => {
    if (!api) return;
    const index = api.selectedScrollSnap();
    const type = index == 0 ? undefined : PRODUCER_TYPES[index - 1];
    setTypeFilter(type);
  }, [api, setTypeFilter]);

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", handler);
    return () => {
      api.off("select", handler);
    };
  }, [api, handler]);

  return (
    <Carousel
      setApi={setApi}
      className="h-[50vh] flex w-full"
      opts={{ loop: true }}
    >
      <CarouselContent className="h-full w-full">
        {slides.map((slide) => (
          <CarouselItem className="h-full w-full relative" key={slide.id}>
            <Image
              width={1920}
              height={1080}
              alt={slide.title}
              src={slide.imageUrl}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 left-0 w-full bg-black/10 h-full" />
            <SearchBox title={slide.title} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselNext className="max-md:top-3/4" />
      <CarouselPrevious className="max-md:top-3/4" />
    </Carousel>
  );
}
