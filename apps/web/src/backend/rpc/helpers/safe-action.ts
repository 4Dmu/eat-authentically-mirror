import { logger } from "@/backend/lib/log";
import { ActionClient } from "@ea/shared/action-client";

export const actionClient = new ActionClient([], logger);
