import { format } from "date-fns/format";
import Link from "next/link";

export function Footer() {
  return (
    <div className="p-10 bg-primary text-primary-foreground flex flex-wrap justify-between">
      <p>
        © {format(new Date(), "yyyy")} AgenciaLLC dba EatAuthentically.
        Discover authentic food experiences.
      </p>
      <div className="flex gap-3">
        <Link className="underline" href={"/privacy-policy"}>
          Privacy Policy
        </Link>
        <Link className="underline" href={"/terms-of-service"}>
          Terms of Service
        </Link>
      </div>
    </div>
  );
}
