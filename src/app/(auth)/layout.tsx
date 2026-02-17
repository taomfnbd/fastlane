import { Zap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-primary"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Zap className="h-5 w-5" />
        </div>
        <span className="text-2xl font-bold">Fastlane</span>
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
