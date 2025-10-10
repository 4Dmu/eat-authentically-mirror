import { NextResponse } from "next/server";
import { handlers } from "../../../_helpers/request";

/**
 * @swagger
 *
 * /api/external/v1/producers/[id]/stats:
 *   get:
 */
export const GET = handlers.get<{ id: string }>(async ({ params }) => {
  console.log(params);
  return NextResponse.json({ items: [] });
});
