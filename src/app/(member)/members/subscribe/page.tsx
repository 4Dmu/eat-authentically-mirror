import { TiersCard } from "@/components/sub/MemberTiersCard";

export default function Page() {
  return (
    <main className="p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-10 items-center">
        <h1 className="font-bold text-3xl">
          Join the Find Real Food Community.
        </h1>
        <TiersCard currentTier={"Free"} />
      </div>
    </main>
  );
}
