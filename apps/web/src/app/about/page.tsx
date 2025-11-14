import Image from "next/image";
import { Badge } from "@ea/ui/badge";
import { Separator } from "@ea/ui/separator";
import {
  HeartIcon,
  InfoIcon,
  MapPin,
  SearchIcon,
  TreeDeciduousIcon,
  UsersIcon,
} from "lucide-react";
import { Alert, AlertTitle } from "@ea/ui/alert";
import { Button } from "@ea/ui/button";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="flex flex-col items-center">
      <div className="h-[80vh] min-h-[500px] w-full relative">
        <div className="w-full h-full absolute top-0 left-0 bg-cover bg-center bg-[url(/hero/FRF_Home.jpg)]" />
        <div className="w-full h-full absolute top-0 left-0 bg-linear-to-b from-teal-200/80 to-green-700/80" />
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col gap-5 items-center text-center">
          <Badge
            className="h-[unset] p-2 px-5 rounded-full"
            variant={"secondary"}
          >
            Our Story
          </Badge>
          <h1 className="text-white font-bold text-5xl drop-shadow-lg">
            Food You Can Trust is Closer Than You Think
          </h1>
          <p className="text-white text-xl drop-shadow-lg">
            Stop guessing. Start discovering. Your guide to local, organic, and
            farm-direct food.
          </p>
        </div>
      </div>
      <div className="p-10 py-20 flex flex-col gap-10 items-center text-center max-w-5xl">
        <h2 className="font-bold text-3xl text-primary">
          Are You Tired of the Guesswork?
        </h2>
        <p className="font-medium text-lg">
          You want to feed yourself and your family the best. Food that&apos;s
          free of chemicals, raised with respect, and grown with care. But
          finding it can feel like a full-time job.
        </p>
        <em className="font-bold text-lg text-primary/80">
          What if you had a map? A map that leads you past the confusing labels
          and directly to the source.
        </em>
        <div className="grid gap-5 md:grid-cols-3 w-full">
          <div className="w-full p-3 border-2 border-primary bg-white rounded-lg flex flex-col items-center gap-5 text-center">
            <div className="size-14 rounded-full text-primary bg-primary/12 flex justify-center items-center">
              <SearchIcon />
            </div>
            <p className="font-bold text-lg text-primary">FIND</p>
            <p>
              Nearby farms for fresh organic produce and pasture-raised meats
            </p>
          </div>
          <div className="w-full p-3 border-2 border-primary bg-white rounded-lg flex flex-col items-center gap-5 text-center">
            <div className="size-14 rounded-full text-primary bg-primary/12 flex justify-center items-center">
              <MapPin />
            </div>
            <p className="font-bold text-lg text-primary">DISCOVER</p>
            <p>
              Farm-to-table restaurants that build menus around the local
              harvest
            </p>
          </div>
          <div className="w-full p-3 border-2 border-primary bg-white rounded-lg flex flex-col items-center gap-5 text-center">
            <div className="size-14 rounded-full text-primary bg-primary/12 flex justify-center items-center">
              <UsersIcon />
            </div>
            <p className="font-bold text-lg text-primary">CONNECT</p>
            <p>Directly with the people who grow and prepare your food</p>
          </div>
        </div>
      </div>
      <Separator />
      <div className="bg-white w-full flex justify-center">
        <div className="p-10 py-20 flex flex-col items-center gap-20 text-center max-w-5xl">
          <h2 className="font-bold text-3xl text-primary">
            Our Vision: Building a Community on Trust
          </h2>
          <div className="flex flex-col gap-20">
            <div className="grid md:grid-cols-2 gap-10">
              <div className="flex flex-col gap-3 items-center justify-center">
                <h3 className="font-bold text-2xl text-primary">
                  50,000+ Authentic Food Sources
                </h3>
                <p>
                  EatAuthentically begins as the world&apos;s largest directory
                  of conscious food producers, with nearly 50,000 listings
                  compiled from a wide variety of public sources. This is our
                  foundation.
                </p>
                <p>
                  Our true mission is to transform this directory into a living,
                  transparent community. We invite every producer on our
                  platform to claim their listing, tell their story, and share
                  the details of their practices directly with you.
                </p>
              </div>
              <Image
                alt="ranch"
                width={800}
                height={800}
                className="rounded-lg object-cover w-full"
                src="/hero/FRF_Ranch_Default.jpg"
              />
            </div>
            <div className="grid md:grid-cols-2 gap-10">
              <Image
                alt="ranch"
                width={800}
                height={800}
                className="rounded-lg object-cover w-full max-md:row-start-2"
                src="/hero/FRF_Eaterie_Default.jpg"
              />
              <div className="flex flex-col gap-3 items-center justify-center">
                <h3 className="font-bold text-2xl text-primary">
                  Verified by You, For You
                </h3>
                <p>
                  As a user, you are part of this process. When you see a
                  &quot;Claimed by Producer&quot; badge, it&apos;s your signal
                  that the information is verified and comes straight from the
                  source. It&apos;s the first step in building a food system
                  where transparency is the main ingredient.
                </p>
                <Alert variant="default">
                  <InfoIcon />
                  <AlertTitle>
                    Claimed listings are verified and maintained by the
                    producers themselves
                  </AlertTitle>
                </Alert>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-tertiary text-tertiary-foreground w-full flex justify-center">
        <div className="p-10 py-20 flex flex-col items-center gap-20 text-center max-w-5xl">
          <div className="flex flex-col gap-2">
            <h2 className="font-bold text-3xl">What We Champion</h2>
            <p>
              We celebrate producers and eateries who are passionate about
              quality and authenticity
            </p>
          </div>
          <div className="flex gap-10">
            <div className="flex flex-col gap-5 items-center">
              <div className="bg-primary/10 rounded-full p-5">
                <TreeDeciduousIcon />
              </div>
              <p className="font-bold">Organic Excellence</p>
              <p>Committed to sustainable, chemical-free farming practices</p>
            </div>
            <div className="flex flex-col gap-5 items-center">
              <div className="bg-primary/10 rounded-full p-5">
                <HeartIcon />
              </div>
              <p className="font-bold">Animal Welfare</p>
              <p>Humane treatment and pasture-raised practices</p>
            </div>
            <div className="flex flex-col gap-5 items-center">
              <div className="bg-primary/10 rounded-full p-5">
                <UsersIcon />
              </div>
              <p className="font-bold">Community First</p>
              <p>Supporting local economies and building connections</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white w-full flex justify-center">
        <div className="p-10 py-20 flex flex-col items-center gap-10 text-center max-w-5xl">
          <h2 className="font-bold text-4xl text-primary">
            Ready to Discover Authentic Food Near You?
          </h2>
          <p className="text-lg text-primary/80">
            Join thousands of conscious eaters connecting with local farms and
            authentic eateries
          </p>
          <Button
            asChild
            variant={"secondary"}
            className="h-[unset] py-4 px-10 text-lg shadow-xl rounded-xl"
          >
            <Link href={"/"}>Start Exploring</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
