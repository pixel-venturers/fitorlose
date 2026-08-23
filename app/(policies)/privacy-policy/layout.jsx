import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground mb-4">
        <Link href="/" className="text-primary">
          Home
        </Link>{" "}
        / Privacy Policy
      </div>
      <div>{children}</div>
    </div>
  );
}
