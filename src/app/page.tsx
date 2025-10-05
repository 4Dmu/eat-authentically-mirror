"use client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useLayoutEffect, useRef, useState } from "react";
import { ConsumerForm } from "./_components/consumer-form";
import { ProducerForm } from "./_components/producer-form";

export default function Home() {
  const [mode, setMode] = useState<"consumer" | "producer" | undefined>(
    undefined
  );
  const consumerInputRef = useRef<HTMLInputElement>(null);
  const producerInputRef = useRef<HTMLInputElement>(null);

  function focus() {
    if (mode === "consumer") {
      consumerInputRef.current?.scrollIntoView();
      consumerInputRef.current?.focus();
    } else if (mode === "producer") {
      producerInputRef.current?.scrollIntoView();
      producerInputRef.current?.focus();
    }
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
        <div className="fixed inset-0 bg-black/35 z-[-1]" />

        <div className="w-full h-full flex justify-center items-center z-50">
          <section className="flex flex-col gap-5 p-10">
            <div className="text-white text-center space-y-2">
              <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-shadow-lg">
                For lovers of real food—and those who make it.
              </h1>
              <p className="text-lg text-shadow-lg">
                Be the first to Eat Authentically.
              </p>
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
