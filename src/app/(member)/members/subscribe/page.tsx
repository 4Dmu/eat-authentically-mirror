import { TiersCard } from "@/components/sub/MemberTiersCard";

export default function Page() {
  return (
    <main className="p-10 pt-20">
      <div className="max-w-3xl mx-auto flex flex-col gap-10 items-center">
        <div className="flex flex-col gap-3 items-center text-center">
          <h1 className="font-bold text-3xl">Become a Community Member</h1>
          <p className="text-xl text-muted-foreground">
            Unlock the full EatAuthentically experience with reviews, messaging
            and exclusive community features.
          </p>
        </div>
        <TiersCard />
      </div>
    </main>
  );
}
