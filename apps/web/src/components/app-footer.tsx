import { format } from "date-fns/format";
import Link from "next/link";

export function Footer() {
  return (
    <div className="p-10 bg-primary text-primary-foreground flex-1 h-auto flex items-end">
      <div className="flex gap-2">
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
    </div>
  );
}
