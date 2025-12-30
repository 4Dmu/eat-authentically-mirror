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
  // biome-ignore lint/suspicious/noExplicitAny: Need any
  (message: string, args?: Record<string | symbol, any>) => void
>;

type Logger = Record<
  string,
  // biome-ignore lint/suspicious/noExplicitAny: Need any
  (message: string, args?: Record<string | symbol, any>) => void
>;

export const multiLoggerFactory = <T extends Logger | Console>(
  loggers: T[]
) => {
  return <T extends "debug" | "info" | "warn" | "error">(
    method: T,
    message: string,
    args?: Record<string | symbol, any>
  ) => {
    loggers.forEach((l) => {
      l[method](message, args);
    });
  };
};

export const flushingLogger = () => {
  after(() => {
    axiomLogger.flush();
  });

  return logger;
};
