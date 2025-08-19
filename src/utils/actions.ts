import { SafeActionResult, ValidationErrors } from "next-safe-action";
import { StandardSchemaV1 } from "@standard-schema/spec";

export function throwErrors<
  S extends StandardSchemaV1 | undefined,
  CVE = ValidationErrors<S>,
  Data = unknown,
  NextCtx = object
>(result: SafeActionResult<string, S, CVE, Data, NextCtx>) {
  if (result.serverError) {
    throw new Error(result.serverError);
  } else if (result.validationErrors) {
    throw new Error(JSON.stringify(result.validationErrors));
  } else if (result.data === undefined) {
    throw new Error("Missing data");
  }

  return result.data;
}
