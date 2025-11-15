"use client";
import type { ProducerWithAll } from "@ea/db/schema";
import { useProducer } from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import { ProducerEditForm } from "@/components/forms/edit-producer-form";

export function PageClient(props: { producer: ProducerWithAll }) {
  const producer = useProducer(props.producer.id, {
    initialData: props.producer,
  });

  return (
    <AppWrapper
      crumbs={[
        { url: "/", name: "EA Admin" },
        { url: "/producers", name: "Producers" },
      ]}
      end="Edit Producer"
    >
      <div className="flex justify-center">
        <div className="flex flex-col max-w-6xl w-full p-5">
          <h1>Edit Producer</h1>
          {producer.data && <ProducerEditForm producer={producer.data} />}
        </div>
      </div>
    </AppWrapper>
  );
}
