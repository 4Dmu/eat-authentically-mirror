import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="flex flex-col items-center justify-center p-20 gap-5">
      <h1 className="font-bold text-xl">404 - Page not found</h1>
      <Link className="underline" href={"/"}>
        Home
      </Link>
    </main>
  );
}
