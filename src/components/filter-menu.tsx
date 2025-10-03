import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { useCertificationTypes } from "@/utils/producers";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { showFilterMenuAtom, useHomePageStore } from "@/stores";
import { LocationFilter } from "./location-filter";
import { FilterIcon } from "lucide-react";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { SelectValue } from "@radix-ui/react-select";
import { useAtom } from "jotai";

export function FilterMenu() {
  const certsQuery = useCertificationTypes();
  const { certs, setCerts, useIpGeo, setUseIpGeo, typeFilter, setTypeFilter } =
    useHomePageStore();
  const [showFilterMenu, setShowFilterMenu] = useAtom(showFilterMenuAtom);

  return (
    <Sheet open={showFilterMenu} onOpenChange={setShowFilterMenu}>
      <SheetTrigger asChild>
        <Button variant={"brandGreen"}>
          <FilterIcon /> Filter
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter And Sort</SheetTitle>
        </SheetHeader>
        <div className="p-5">
          <div className="mb-5 flex flex-col gap-2">
            <Label>Filter Type</Label>
            <Select
              value={typeFilter === undefined ? "none" : typeFilter}
              onValueChange={(v) =>
                setTypeFilter(v === "none" ? undefined : (v as "farm"))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={"Farm..."} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="farm">Farm</SelectItem>
                <SelectItem value="ranch">Ranch</SelectItem>
                <SelectItem value="eatery">Eatery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label>Sort by closest to you</Label>
            <Switch checked={useIpGeo} onCheckedChange={setUseIpGeo} />
          </div>
          <Accordion
            about=""
            className="h-full"
            defaultValue={["item-1", "item-2"]}
            type="multiple"
          >
            <AccordionItem value="item-1">
              <AccordionTrigger>Certifications</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                {certsQuery.data?.map((cert) => (
                  <div className="flex gap-2" key={cert.id}>
                    <Checkbox
                      checked={certs.some((c) => cert.id === c.id)}
                      onCheckedChange={(e) => {
                        if (e === true) {
                          setCerts([
                            ...certs,
                            {
                              name: cert.name,
                              id: cert.id,
                              mustBeVerified: false,
                            },
                          ]);
                        } else {
                          setCerts([...certs.filter((c) => c.id !== cert.id)]);
                        }
                      }}
                      id={cert.id}
                      name={cert.name}
                    ></Checkbox>
                    <Label htmlFor={cert.name} className="capitalize">
                      {cert.name}
                    </Label>
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="w-full h-full">
              <AccordionTrigger>Location</AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <LocationFilter />
                {/* <SignedIn>
                </SignedIn>
                <SignedOut>
                  <Alert variant={"destructive"}>
                    <MessageCircleWarning />
                    <AlertTitle>
                      You must be logged in to filter by location
                    </AlertTitle>
                  </Alert>
                  <Button asChild>
                    <SignInButton>Login</SignInButton>
                  </Button>
                </SignedOut> */}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </SheetContent>
    </Sheet>
  );
}
