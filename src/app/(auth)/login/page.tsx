"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await signIn.email({
        email,
        password,
        callbackURL: "/admin/dashboard",
      });

      if (result.error) {
        toast.error(result.error.message ?? "Invalid credentials");
        setLoading(false);
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Fastlane</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
            className="h-9 text-sm"
          />
        </div>
        <Button type="submit" className="w-full h-9 text-sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="text-xs text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-foreground transition-colors">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
