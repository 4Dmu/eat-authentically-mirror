import { db } from "@ea/db";
import { externalApiKeys, type ExternalApiKeySelect } from "@ea/db/schema";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";

function get_search<T extends StandardSchemaV1>(
  searchParamsSchema: T,
  handler: (input: {
    search: StandardSchemaV1.InferOutput<T>;
    req: NextRequest;
    apiKey: ExternalApiKeySelect;
  }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const auth = req.headers.get("Authorization");

    if (!auth) {
      return NextResponse.json(
        { message: "Missing auth header" },
        { status: 401 }
      );
    }
    const apiKey = auth.substring(6).trim();

    if (!auth.startsWith("Bearer ") || apiKey.length === 0) {
      return NextResponse.json(
        { message: "Invalid auth header" },
        { status: 401 }
      );
    }

    const token = await db.query.externalApiKeys.findFirst({
      where: eq(externalApiKeys.apiKey, apiKey),
    });

    if (!token) {
      return NextResponse.json({ message: "Invalid api key" }, { status: 401 });
    }

    const query = Object.fromEntries(req.nextUrl.searchParams.entries());
    let result = searchParamsSchema["~standard"].validate(query);
    if (result instanceof Promise) result = await result;

    if (result.issues) {
      return NextResponse.json({
        error: JSON.stringify(result.issues, null, 2),
        message: "Invalid query paramaters",
      });
    }
    return handler({ search: result.value, req: req, apiKey: token });
  };
}

const get_ = <TParams extends Record<string, string>>(
  handler: (input: {
    params: TParams;
    req: NextRequest;
    apiKey: ExternalApiKeySelect;
  }) => Promise<Response>
) => {
  return async (req: NextRequest, ctx: { params: Promise<TParams> }) => {
    const auth = req.headers.get("Authorization");

    if (!auth) {
      return NextResponse.json(
        { message: "Missing auth header" },
        { status: 401 }
      );
    }
    const apiKey = auth.substring(6).trim();

    if (!auth.startsWith("Bearer ") || apiKey.length === 0) {
      return NextResponse.json(
        { message: "Invalid auth header" },
        { status: 401 }
      );
    }

    const token = await db.query.externalApiKeys.findFirst({
      where: eq(externalApiKeys.apiKey, apiKey),
    });

    if (!token) {
      return NextResponse.json({ message: "Invalid api key" }, { status: 401 });
    }

    const params = await ctx.params;

    return handler({ params, req: req, apiKey: token });
  };
};

function post_body<T extends StandardSchemaV1>(
  bodySchema: T,
  handler: (input: {
    body: StandardSchemaV1.InferOutput<T>;
    req: NextRequest;
    apiKey: ExternalApiKeySelect;
  }) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const auth = req.headers.get("Authorization");

    if (!auth) {
      return NextResponse.json(
        { message: "Missing auth header" },
        { status: 401 }
      );
    }
    const apiKey = auth.substring(6).trim();

    if (!auth.startsWith("Bearer ") || apiKey.length === 0) {
      return NextResponse.json(
        { message: "Invalid auth header" },
        { status: 401 }
      );
    }

    const token = await db.query.externalApiKeys.findFirst({
      where: eq(externalApiKeys.apiKey, apiKey),
    });

    if (!token) {
      return NextResponse.json({ message: "Invalid api key" }, { status: 401 });
    }

    const body = await req.json();
    let result = bodySchema["~standard"].validate(body);
    if (result instanceof Promise) result = await result;

    if (result.issues) {
      return NextResponse.json({
        error: JSON.stringify(result.issues, null, 2),
        message: "Invalid query paramaters",
      });
    }
    return handler({ body: result.value, req: req, apiKey: token });
  };
}

const get = Object.assign(get_, { search: get_search });

export const handlers = {
  get: get,
  post: {
    body: post_body,
  },
};
