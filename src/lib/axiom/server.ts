import axiomClient from "@/lib/axiom/axiom";
import { env } from "@/env";
import { Logger, AxiomJSTransport } from "@axiomhq/logging";
import { createAxiomRouteHandler, nextJsFormatters } from "@axiomhq/nextjs";

export const logger = new Logger({
  transports: [
    new AxiomJSTransport({
      axiom: axiomClient,
      dataset: env.NEXT_PUBLIC_AXIOM_DATASET!,
    }),
    {
      log: (value) => console.log(...value),
      flush: () => {},
    },
  ],
  formatters: nextJsFormatters,
});

export const withAxiom = createAxiomRouteHandler(logger);
