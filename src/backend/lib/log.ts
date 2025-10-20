import { logger as axiomLogger } from "@/lib/axiom/server";
import { after } from "next/server";

export const logger = {
  debug: (message: string, args?) => {
    axiomLogger.debug(message, args);
  },
  info: (message: string, args?) => {
    axiomLogger.info(message, args);
  },
  warn: (message: string, args?) => {
    axiomLogger.warn(message, args);
  },
  error: (message: string, args?) => {
    axiomLogger.error(message, args);
  },
} satisfies Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (message: string, args?: Record<string | symbol, any>) => void
>;

export const flushingLogger = () => {
  after(() => {
    axiomLogger.flush();
  });

  return logger;
};
