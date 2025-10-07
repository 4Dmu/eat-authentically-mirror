import { logger as axiomLogger } from "@/lib/axiom/server";
import { after } from "next/server";

export const logger = {
  debug: (message: string, args?) => {
    axiomLogger.debug(message, args);
    console.debug(message, args);
  },
  info: (message: string, args?) => {
    axiomLogger.info(message, args);
    console.info(message, args);
  },
  warn: (message: string, args?) => {
    axiomLogger.warn(message, args);
    console.warn(message, args);
  },
  error: (message: string, args?) => {
    axiomLogger.error(message, args);
    console.error(message, args);
  },
} satisfies Record<
  string,
  (message: string, args?: Record<string | symbol, any>) => void
>;

export const flushingLogger = () => {
  after(() => {
    axiomLogger.flush();
  });

  return logger;
};
