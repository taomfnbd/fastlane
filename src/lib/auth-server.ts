import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/generated/prisma/client";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
    redirect("/portal/dashboard");
  }
  return session;
}

export async function requireClient() {
  const session = await requireSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, companyId: true },
  });
  if (!user || (user.role !== "CLIENT_ADMIN" && user.role !== "CLIENT_MEMBER")) {
    redirect("/admin/dashboard");
  }
  if (!user.companyId) {
    redirect("/login");
  }
  return { ...session, companyId: user.companyId };
}

export async function getUserWithRole(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      companyId: true,
      image: true,
    },
  });
}

export function isAdmin(role: UserRole) {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

export function isClient(role: UserRole) {
  return role === "CLIENT_ADMIN" || role === "CLIENT_MEMBER";
}
