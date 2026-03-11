import Link from "next/link";

export const metadata = { title: "Inscription" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Inscription</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Les inscriptions sont gerees par un administrateur Fastlane.
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30 px-4 py-3">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          Pour obtenir un acces, contactez votre administrateur Fastlane qui creera votre compte.
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Deja un compte ?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
