"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      const res = await fetch(`${baseUrl}/api/auth/request-password-reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, redirectTo: "/reset-password" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.message ?? "Une erreur est survenue");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-lg font-semibold">Email envoye</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Si un compte existe avec cette adresse, vous recevrez un email avec un lien de reinitialisation.
          </p>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 px-4 py-3">
          <p className="text-sm text-emerald-800 dark:text-emerald-300">
            Verifiez votre boite de reception et vos spams.
          </p>
        </div>

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Mot de passe oublie</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Entrez votre adresse email pour recevoir un lien de reinitialisation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="vous@exemple.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>
        <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Envoyer le lien
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
