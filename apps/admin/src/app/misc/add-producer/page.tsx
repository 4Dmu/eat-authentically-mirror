import { AppWrapper } from "@/components/app-wrapper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <AppWrapper
      crumbs={[
        { url: "/", name: "EA Admin" },
        { url: "/", name: "Misc" },
      ]}
      end="Add Producer"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>Add Producer</h1>
          </CardTitle>
        </CardHeader>
        <CardContent></CardContent>
      </Card>
    </AppWrapper>
  );
}
