import { env } from "@/env";
import { Axiom } from "@axiomhq/js";

const axiomClient = new Axiom({
  token: env.NEXT_PUBLIC_AXIOM_TOKEN,
});

export default axiomClient;
