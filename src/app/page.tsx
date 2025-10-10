"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ConsumerForm } from "./_components/consumer-form";
import { ProducerForm } from "./_components/producer-form";
import {
  ArrowDown,
  ForkKnifeCrossed,
  MapPin,
  MouseIcon,
  Users,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";

export default function Home() {
  const [mode, setMode] = useState<"consumer" | "producer" | undefined>(
    undefined
  );
  const consumerInputRef = useRef<HTMLInputElement>(null);
  const producerInputRef = useRef<HTMLInputElement>(null);
  const secondCtaRef = useRef<HTMLDivElement>(null);

  const focus = useCallback(() => {
    if (mode === "consumer") {
      consumerInputRef.current?.scrollIntoView();
      consumerInputRef.current?.focus();
    } else if (mode === "producer") {
      producerInputRef.current?.scrollIntoView();
      producerInputRef.current?.focus();
    }
  }, [mode]);

  function scroll() {
    secondCtaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useLayoutEffect(() => focus(), [mode, focus]);

  return (
    <div className="">
      <div className="relative w-screen h-screen overflow-hidden">
        <div className="fixed inset-0 bg-black/90 z-[-1]" />

        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero0.jpg)] animate-[fade1_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero1.jpg)] animate-[fade2_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero2.jpg)] animate-[fade3_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero3.jpg)] animate-[fade4_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/tomatoesontable.jpg)] animate-[fade5_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-black/50 z-[-1]" />

        <div className="w-full h-full flex justify-center items-center z-50">
          <section className="flex flex-col gap-5 p-10">
            <div className="text-white text-center space-y-10">
              <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-shadow-lg">
                For lovers of real food—and those who make it.
              </h1>

              <p className="font-bold">Coming Soon</p>
            </div>
            <div className="flex gap-5 justify-center">
              <Button
                variant={"brandGreen"}
                className="w-36 p-5"
                onClick={() => {
                  if (mode == "consumer") {
                    focus();
                  } else {
                    setMode("consumer");
                  }
                }}
              >
                Join Waitlist
              </Button>
              <Button
                onClick={() => {
                  if (mode == "producer") {
                    focus();
                  } else {
                    setMode("producer");
                  }
                }}
                className="w-36 p-5"
              >
                Add your Listing
              </Button>
            </div>
          </section>
          <button
            onClick={scroll}
            className="absolute cursor-pointer top-[80%] left-1/2 -translate-x-1/2 rounded-full animate-bounce opacity-50 p-2 flex flex-col items-center bg-brand-red text-white px-10"
          >
            <MouseIcon />
            <ArrowDown />
          </button>
        </div>
      </div>

      <Separator ref={secondCtaRef} />

      <div className="bg-[#f9f8f5] text-foreground">
        <section className="p-10 py-30 flex flex-col items-center gap-8 text-center">
          <h2 className="font-bold text-5xl text-shadow-sm">
            Food You Can Trust is Closer Than You Think.
          </h2>
          <p className="text-xl">Stop guessing. Start discovering.</p>
          <p className="text-xl">
            EatAuthentically is your guide to the world of local, organic, and
            farm-direct food.
          </p>
        </section>

        <Separator />

        <section className="p-10 py-20 bg-[#f5f2ef]">
          <Card>
            <CardHeader className="flex flex-col gap-5 p-10">
              <h3 className="font-bold text-3xl">
                Are You Tired of the Guesswork?
              </h3>
              <p className="text-lg">
                You want to feed yourself and your family the best. Food
                that&apos;s free of chemicals, raised with respect, and grown
                with care. But finding it can feel like a full-time job.
              </p>
              <p className="font-bold text-lg">
                What if you had a map? A map that leads you past the confusing
                labels and directly to the source.
              </p>
            </CardHeader>
          </Card>
        </section>
        <Separator />
        <section className="p-10 py-30 bg-[#f9f8f5] flex flex-col gap-10">
          <div className="flex flex-col items-center text-center gap-5">
            <h3 className="text-4xl font-bold">
              Your Connection to Conscious Food
            </h3>
            <p className="text-lg">
              EatAuthentically is that map. We are building the most
              comprehensive directory of the local heroes in the food world—the
              farmers, ranchers, and chefs dedicated to quality and integrity.
            </p>
          </div>
          <div className="flex flex-col items-center gap-10">
            <h4 className="font-bold text-2xl">Our platform helps you:</h4>
            <div className="grid grid-cols-3 w-full gap-5">
              <Card className="hover:-translate-y-2 transition">
                <CardHeader className="flex flex-col gap-4">
                  <div className="bg-brand-green/30 text-brand-green p-2 rounded-lg shadow-sm">
                    <MapPin />
                  </div>
                  <h5 className="font-bold text-brand-green">FIND</h5>
                  <p className="text-lg">
                    Nearby farms for fresh organic produce and pasture-raised
                    meats.
                  </p>
                </CardHeader>
              </Card>
              <Card className="hover:-translate-y-2 transition">
                <CardHeader className="flex flex-col gap-4">
                  <div className="bg-brand-green/30 text-brand-green p-2 rounded-lg shadow-sm">
                    <ForkKnifeCrossed />
                  </div>
                  <h5 className="font-bold text-brand-green">DISCOVER</h5>
                  <p className="text-lg">
                    Farm-to-table restaurants that build their menus around the
                    local harvest.
                  </p>
                </CardHeader>
              </Card>
              <Card className="hover:-translate-y-2 transition">
                <CardHeader className="flex flex-col gap-4">
                  <div className="bg-brand-green/30 text-brand-green p-2 rounded-lg shadow-sm">
                    <Users />
                  </div>
                  <h5 className="font-bold text-brand-green">CONNECT</h5>
                  <p className="text-lg">
                    Directly with the people who grow and prepare your food.
                  </p>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>
        <Separator />
        <section className="p-10 py-30 bg-[#f5f2ef] flex flex-col items-center gap-10">
          <h3 className="text-4xl font-bold">Join the Movement</h3>
          <p className="text-lg">
            Be part of the community connecting people with authentic, local
            food sources.
          </p>
          <div className="flex gap-5 justify-center">
            <Button
              variant={"brandGreen"}
              className="w-36 p-5"
              onClick={() => {
                if (mode == "consumer") {
                  focus();
                } else {
                  setMode("consumer");
                }
              }}
            >
              Join Waitlist
            </Button>
            <Button
              variant={"brandBrown"}
              onClick={() => {
                if (mode == "producer") {
                  focus();
                } else {
                  setMode("producer");
                }
              }}
              className="w-36 p-5"
            >
              Add your Listing
            </Button>
          </div>
        </section>
      </div>
      {mode && (
        <>
          <Separator />
          <div className="w-screen min-h-screen relative flex flex-col">
            <div className="w-full flex-1 flex flex-col p-2 md:p-20 justify-center items-center gap-10">
              <div className="w-full gap-10 max-w-4xl z-50">
                {mode === "consumer" && <ConsumerForm ref={consumerInputRef} />}

                {mode === "producer" && <ProducerForm ref={producerInputRef} />}
              </div>
              <div>
                <div className="bg-background p-2 rounded-full gap-2 flex w-full">
                  <button
                    onClick={() => setMode("consumer")}
                    data-state={mode === "consumer" ? "active" : "inactive"}
                    className="data-[state=active]:bg-brand-green cursor-pointer font-bold text-sm transition duration-300 ease-in-out data-[state=active]:text-primary-foreground p-2 rounded-full px-5"
                    value="consumer"
                  >
                    Waitlist
                  </button>
                  <button
                    onClick={() => setMode("producer")}
                    data-state={mode === "producer" ? "active" : "inactive"}
                    className="data-[state=active]:bg-brand-green cursor-pointer font-bold text-sm transition duration-300 ease-in-out data-[state=active]:text-primary-foreground p-2 rounded-full px-5"
                    value="producer"
                  >
                    Add Listing
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
