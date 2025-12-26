import { runEmailFlow } from "@/backend/jobs/email-flow";

async function main() {
  await runEmailFlow();
}

main();
