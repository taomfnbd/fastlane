"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const urlError = searchParams.get("error");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (urlError || !token) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Lien invalide</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ce lien de reinitialisation est invalide ou a expire. Veuillez en demander un nouveau.
          </p>
        </div>
        <Button asChild variant="outline" className="w-full h-9 text-sm">
          <Link href="/forgot-password">Demander un nouveau lien</Link>
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token: token!,
      });

      if (resetError) {
        toast.error(resetError.message ?? "Le lien est invalide ou a expire");
        setLoading(false);
        return;
      }

      setDone(true);
      toast.success("Mot de passe reinitialise avec succes");
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Mot de passe reinitialise</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Votre mot de passe a ete mis a jour. Vous pouvez maintenant vous connecter.
          </p>
        </div>

        <Button asChild className="w-full h-9 text-sm">
          <Link href="/login">Se connecter</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            placeholder="Au moins 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm">Confirmer</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirmez le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>
        <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Reinitialiser
        </Button>
      </form>

      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3 w-3" />
        Retour a la connexion
      </Link>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
