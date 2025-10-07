import { StandardSchemaV1 } from "@standard-schema/spec";
import { NextRequest, NextResponse } from "next/server";

export function get<T extends StandardSchemaV1>(
  searchParamsSchema: T,
  handler: (input: {
    search: StandardSchemaV1.InferOutput<T>;
    req: NextRequest;
  }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    let result = searchParamsSchema["~standard"].validate(query);
    if (result instanceof Promise) result = await result;

    if (result.issues) {
      return NextResponse.json({
        error: JSON.stringify(result.issues, null, 2),
        message: "Invalid query paramaters",
      });
    }
    return handler({ search: result.value, req: req });
  };
}
