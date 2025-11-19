import { useLoggedInUserProducerIds } from "@/hooks/use-logged-in-user-producer-ids";
import type { PropsWithChildren } from "react";

export function IsProducer(
  props: PropsWithChildren & { producerIds: string[] }
) {
  const { ids } = useLoggedInUserProducerIds({
    producerIds: props.producerIds,
  });
  const allow = ids.length > 0;

  if (allow) {
    return <>{props.children}</>;
  }

  return null;
}

export function IsNotProducer(
  props: PropsWithChildren & { producerIds: string[] }
) {
  const { ids } = useLoggedInUserProducerIds({
    producerIds: props.producerIds,
  });
  const allow = ids.length === 0;

  if (allow) {
    return <>{props.children}</>;
  }

  return null;
}
