import { SubTier } from "@/backend/rpc/utils/get-sub-tier";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { match } from "ts-pattern";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Certification } from "@/backend/validators/listings";
import { useStore } from "@tanstack/react-form";
import { emptyOptions, withForm } from "../form";

export const CertificationsForm = withForm({
  ...emptyOptions,
  props: {
    tier: "Free" as SubTier,
    certifications: [] as Certification[],
  },
  render: function Render({ form, tier, certifications }) {
    const certificationsFieldValue = useStore(
      form.store,
      (state) => state.values.certifications
    );
    const maxCerts = match(tier)
      .with("Free", () => 3)
      .with({ tier: "community" }, () => 3)
      .with({ tier: "pro" }, () => 5)
      .with({ tier: "premium" }, () => 10)
      .exhaustive();

    return (
      <Card>
        <CardHeader className="flex justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Certifications</CardTitle>
            <CardDescription>
              Add certifications to showcase your practices and standards.
            </CardDescription>
          </div>
          <div>
            <span>
              {certificationsFieldValue?.length ?? 0}/{maxCerts}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <form.Field name="certifications" mode="array">
            {(field) => (
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <Label>Your Certifications</Label>
                  <div className="flex flex-wrap gap-2">
                    {field.state.value.map((v, i) => (
                      <div className="relative" key={i}>
                        <Badge>{v.name}</Badge>
                        <Button
                          onClick={() => field.removeValue(i)}
                          className="absolute -top-1 -right-2 size-4 rounded-full"
                          variant={"destructive"}
                          size={"icon"}
                        >
                          <XIcon size={3} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Add Certifications</Label>
                  <div className="relative">
                    <SearchIcon
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
                      size={20}
                    />
                    <Input
                      className="pl-10"
                      placeholder="Search certifications..."
                    />
                  </div>
                  <div className="flex flex-wrap">
                    {certifications.map((cert) => (
                      <Button
                        onClick={() => field.pushValue(cert)}
                        key={cert.id}
                        variant={"ghost"}
                      >
                        {cert.name}
                        <PlusIcon />
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </form.Field>
        </CardContent>
      </Card>
    );
  },
});
