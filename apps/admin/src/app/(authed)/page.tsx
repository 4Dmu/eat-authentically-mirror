import { AppWrapper } from "@/components/app-wrapper";
import { sessionOrRedirect } from "@/lib/auth-helpers";
// import { db } from "@ea/db";
// import { producers } from "@ea/db/schema";
import {
  GLOBAL_PRODUCER_PROFILE_ANALYTICS,
  PRODUCER_PROFILE_ANALYTICS,
} from "@ea/kv";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ea/ui/card";
// import { inArray } from "drizzle-orm";
import { BarChart } from "@ea/charts/bar-chart";

export default async function Home() {
  await sessionOrRedirect();
  const analytics = await GLOBAL_PRODUCER_PROFILE_ANALYTICS.retrieveDays(90);
  const totalViews = await PRODUCER_PROFILE_ANALYTICS.getGlobalTotalViews();
  const viewsToday = await GLOBAL_PRODUCER_PROFILE_ANALYTICS.retrieve(
    GLOBAL_PRODUCER_PROFILE_ANALYTICS.date()
  );
  // const top5ProducerViews = await PRODUCER_PROFILE_ANALYTICS.getTopProducers(5);
  // const top5Producers = await db.query.producers.findMany({
  //   where: inArray(
  //     producers.id,
  //     top5ProducerViews.map((p) => p.producerId)
  //   ),
  //   columns: {
  //     name: true,
  //     id: true,
  //   },
  // });

  return (
    <AppWrapper crumbs={[{ url: "/", name: "EA Admin" }]} end="Home">
      <div className="flex flex-col gap-10">
        <h1 className="font-bold text-2xl">Admin</h1>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Producer Views</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex gap-5 w-full">
                <Card className="px-10 flex-1">
                  <CardTitle>{totalViews}</CardTitle>
                  <CardDescription>All Time Views</CardDescription>
                </Card>
                <Card className="px-10 flex-1">
                  <CardTitle>{viewsToday.stats.total}</CardTitle>
                  <CardDescription>Views Today</CardDescription>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Views</CardTitle>
                </CardHeader>
                <CardContent>
                  <BarChart
                    data={analytics.days.map((day) => ({
                      name: day.date,
                      ...day.stats,
                    }))}
                    categories={["total", "public", "authenticated"]}
                    index="name"
                  />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppWrapper>
  );
}
