"use client";
import { useAuth } from "@clerk/nextjs";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function AthorizePage() {
  const router = useRouter();
  const { isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      router.push("/");
    }
  }, [isLoaded, router]);

  return (
    <div className="bg-primary h-screen flex justify-center items-center w-full">
      <div className="p-10 font-bold text-lg gap-2 flex flex-col items-center">
        <p>Authorizing</p>
        <Loader size={50} className="animate-spin" />
      </div>
    </div>
  );
}
