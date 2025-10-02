"use client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useEffect, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";

export default function Home() {
  const [mode, setMode] = useState<"consumer" | "producer" | undefined>(
    undefined
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode) {
      inputRef.current?.scrollIntoView();
      inputRef.current?.focus();
    }
  }, [mode]);

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
              <p>Coming Soon</p>
            </div>
            <div className="flex gap-5 justify-center">
              <Button
                variant={"brandGreen"}
                className="w-36 p-5"
                onClick={() => {
                  setMode("consumer");
                  if (mode == "consumer") {
                    inputRef.current?.scrollIntoView();
                    inputRef.current?.focus();
                  }
                }}
              >
                Join Waitlist
              </Button>
              <Button
                onClick={() => {
                  setMode("producer");
                  if (mode == "producer") {
                    inputRef.current?.focus();
                    inputRef.current?.focus();
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
        <Tabs value={mode} onValueChange={(e) => setMode(e as "producer")}>
          <Separator />
          <div className="w-screen h-screen relative">
            <div className="w-full h-full items-center justify-center flex z-50 p-5 sm:p-10 md:p-20">
              <div className="w-full gap-10 max-w-4xl">
                <TabsContent value="consumer">
                  <Card className="w-full" id="consumer">
                    <CardHeader>
                      <CardTitle className="text-3xl font-fraunces">
                        Discover where real food lives
                      </CardTitle>
                      <CardDescription>
                        Be the first to explore authentic farms, ranches, and
                        eateries near you. Join our wait list and get early
                        access to Eat Authentically.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className=" flex flex-col gap-2">
                        <Input
                          ref={inputRef}
                          placeholder="Email"
                          type="email"
                        />
                        <Button>Submit</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="producer">
                  <Card className="w-full" id="producer">
                    <CardHeader>
                      <CardTitle className="text-3xl font-fraunces">
                        For those who grow and serve authentic food.
                      </CardTitle>
                      <CardDescription>
                        Connect with conscious eaters who are looking for what
                        you do best. Add your farm, ranch, or eatery today—if
                        you’re already on our map, we’ll update your info and
                        mark your listing as yours.{" "}
                        <span className="text-xs text-red-500">
                          * (pending verification)
                        </span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form className=" flex flex-col gap-2">
                        <Input ref={inputRef} placeholder="Listing name" />
                        <Input placeholder="Email" type="email" />
                        <Input placeholder="Phone" type="tel" />
                        <Input placeholder="Website" type="url" />
                        <Input placeholder="Address" />
                        <Button>Submit</Button>
                      </form>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>

            <div className="p-10 absolute bottom-0 right-0">
              <TabsList className="bg-background p-2 rounded-full gap-2 flex">
                <TabsTrigger
                  className="data-[state=active]:bg-brand-green font-bold text-sm transition duration-300 ease-in-out data-[state=active]:text-primary-foreground p-2 rounded-full px-5"
                  value="consumer"
                >
                  Waitlist
                </TabsTrigger>
                <TabsTrigger
                  className="data-[state=active]:bg-brand-green font-bold text-sm transition duration-300 ease-in-out data-[state=active]:text-primary-foreground p-2 rounded-full px-5"
                  value="producer"
                >
                  Add Listing
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </Tabs>
      )}
    </div>
  );
}
