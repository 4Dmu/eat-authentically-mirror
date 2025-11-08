"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function LoginPageClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function login() {
    const { data, error } = await authClient.signIn.email({
      email: email, // required
      password: password, // required
      rememberMe: true,
      callbackURL: "/",
    });

    console.log("data", data);
    console.log("error", error);

    if (data) {
      router.replace(data.url ?? "/");
    } else {
      toast.error(error.message);
    }
  }

  return (
    <div className="p-20 flex h-screen items-center justify-center">
      <main>
        <Card className="md:w-xl">
          <CardHeader>
            <CardTitle>
              <h1>Login To EatAuthentically Admin</h1>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              <Input
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                placeholder="Email"
                type="email"
              />
              <Input
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                placeholder="Password"
                type="password"
              />
              <Button
                onClick={login}
                disabled={email === "" || password === ""}
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
