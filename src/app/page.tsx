"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { ConsumerForm } from "./_components/consumer-form";
import { ProducerForm } from "./_components/producer-form";
import { ArrowDown, MouseIcon } from "lucide-react";

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
            className="absolute cursor-pointer top-[80%] left-1/2 -translate-x-1/2 rounded-full animate-bounce outline-2 outline-brand-red outline-dotted opacity-50 p-2 flex flex-col items-center bg-brand-red text-white px-10"
          >
            <MouseIcon />
            <ArrowDown />
          </button>
        </div>
      </div>
      <Separator ref={secondCtaRef} />
      <div className="bg-brand-green text-white p-10 sm:p-20 md:p-40">
        <div className="max-w-3xl text-center mx-auto flex flex-col gap-5 text-xl">
          <h2 className="font-bold text-3xl text-shadow-sm">
            Food You Can Trust is Closer Than You Think.
          </h2>
          <div>
            <p>Stop guessing. Start discovering.</p>
            <p>
              EatAuthentically is your guide to the world of local, organic, and
              farm-direct food.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-2xl text-shadow-sm">
              Are You Tired of the Guesswork?
            </h4>
            <p>
              You want to feed yourself and your family the best. Food
              that&apos;s free of chemicals, raised with respect, and grown with
              care. But finding it can feel like a full-time job.
            </p>
            <p>
              What if you had a map? A map that leads you past the confusing
              labels and directly to the source.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-2xl text-shadow-sm">
              Your Connection to Conscious Food
            </h4>
            <p>
              EatAuthentically is that map. We are building the most
              comprehensive directory of the local heroes in the food world—the
              farmers, ranchers, and chefs dedicated to quality and integrity.
            </p>
          </div>
          <div className="space-y-2">
            <h5 className="font-bold">Our platform helps you:</h5>
            <ul className="list-disc text-left">
              <li>
                <em className="font-bold">FIND</em> nearby farms for fresh
                organic produce and pasture-raised meats.
              </li>
              <li>
                <em className="font-bold">DISCOVER</em> farm-to-table
                restaurants that build their menus around the local harvest.
              </li>
              <li>
                <em className="font-bold">CONNECT</em> directly with the people
                who grow and prepare your food.
              </li>
            </ul>
          </div>
          <div className="flex gap-5 justify-center mt-10">
            <Button
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
        </div>
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
