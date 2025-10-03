import React from "react";

export default function Page() {
  return (
    <div className="">
      <div className="relative w-screen h-screen overflow-hidden">
        <div className="fixed inset-0 bg-black/90 z-[-1]" />

        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero0.jpg)] animate-[fade1_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero1.jpg)] animate-[fade2_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero2.jpg)] animate-[fade3_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/hero3.jpg)] animate-[fade4_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-cover bg-bottom bg-[url(/hero/tomatoesontable.jpg)] animate-[fade5_150s_infinite] z-[-1]" />
        <div className="fixed inset-0 bg-black/80 z-[-1]" />

        <div className="w-full h-full flex justify-center items-center z-50">
          <section className="flex flex-col gap-5 p-10">
            <div className="text-white text-center space-y-4">
              <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl text-shadow-lg">
                Success!
              </h1>
              <p className="text-2xl text-shadow-sm max-w-4xl">
                Your listing has been created, once EatAuthentically is live
                you'll receive an email to create your account, if you opted to
                pre create it you will simply be able to login.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
