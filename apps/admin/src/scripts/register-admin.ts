import { auth } from "@/lib/auth";

async function main(body: {
  name: string;
  email: string;
  password: string;
  image?: string;
  callbackURL?: string;
  rememberMe?: boolean;
}) {
  const data = await auth.api.signUpEmail({
    body: body,
  });
  console.log(data);
}

main({
  name: "Micah",
  email: "developer@agencia.llc",
  password: "aloha108",
});
