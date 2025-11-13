"use client";
import type { ExternalApiKeySelect } from "@ea/db/schema";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { useCreateExternalApiKey, useExternalApiKeys } from "@/client/data";
import { AppWrapper } from "@/components/app-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function ClientPage(props: { keys: ExternalApiKeySelect[] }) {
  const keys = useExternalApiKeys({ initialData: props.keys });
  const createKey = useCreateExternalApiKey({
    onSuccess: async () => await keys.refetch(),
  });

  return (
    <AppWrapper
      crumbs={[
        { url: "/", name: "EA Admin" },
        { url: "/", name: "Misc" },
      ]}
      end="External Api Keys"
    >
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>
            <h1>External Api Keys</h1>
          </CardTitle>
          <Button onClick={() => createKey.mutate()}>New Key</Button>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-5">
          {keys.data?.map((key) => (
            <div key={key.id} className="flex flex-col gap-3">
              <p className="font-bold">
                Api Key {key.createdAt.toDateString()}
              </p>
              <div className="flex gap-1">
                <Input defaultValue={key.apiKey} readOnly />
                <Button
                  onClick={async () => {
                    toast.success("Api Key Coppied");
                    await navigator.clipboard.writeText(key.apiKey);
                  }}
                >
                  <CopyIcon />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppWrapper>
  );
}
