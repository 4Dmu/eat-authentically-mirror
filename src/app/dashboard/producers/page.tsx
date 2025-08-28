import { fetchUserProducers } from "@/backend/rpc/producers";
import Link from "next/link";

export default async function Page() {
  const producers = await fetchUserProducers();

  return (
    <div>
      {producers.map((p) => (
        <div key={p.id}>
          <p>{p.name}</p>
          <Link href={`/dashboard/producers/${p.id}`}>{p.name}</Link>
        </div>
      ))}
    </div>
  );
}
