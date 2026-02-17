"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caracteres");
      return;
    }
    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
        callbackURL: "/portal/dashboard",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Echec de l'inscription");
        setLoading(false);
        return;
      }

      router.push("/portal/dashboard");
      router.refresh();
    } catch {
      toast.error("Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Creer un compte</h1>
        <p className="text-sm text-muted-foreground mt-1">Commencez avec Fastlane</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm">Nom</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jean Dupont"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>
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
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">Mot de passe</Label>
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
        <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Creer le compte
        </Button>
      </form>

      <p className="text-xs text-muted-foreground">
        Deja un compte ?{" "}
        <Link href="/login" className="text-foreground hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
