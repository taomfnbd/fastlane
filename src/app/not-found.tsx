import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
        <h2 className="text-xl font-semibold">Page introuvable</h2>
        <p className="text-muted-foreground">
          La page que vous cherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>
        <Link
          href="/"
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
        >
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
