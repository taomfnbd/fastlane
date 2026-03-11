"use server";

import { prisma } from "@/lib/prisma";
import { requireClient, getUserWithRole } from "@/lib/auth-server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const updateCompanyInfoSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  website: z.string().url("URL invalide").optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
});

const inviteTeamMemberSchema = z.object({
  email: z.string().email("Email invalide"),
  name: z.string().min(1, "Le nom est requis").max(200),
  role: z.enum(["CLIENT_ADMIN", "CLIENT_MEMBER"]),
});

async function requireClientAdmin() {
  const session = await requireClient();
  const user = await getUserWithRole(session.user.id);
  if (!user || user.role !== "CLIENT_ADMIN") {
    throw new Error("Acces refuse — role CLIENT_ADMIN requis");
  }
  return { session, user };
}

export async function updateCompanyInfo(
  data: { name: string; website?: string; industry?: string }
): Promise<ActionResult> {
  const { session } = await requireClientAdmin();

  const parsed = updateCompanyInfoSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  await prisma.company.update({
    where: { id: session.companyId },
    data: {
      name: parsed.data.name,
      website: parsed.data.website || null,
      industry: parsed.data.industry || null,
    },
  });

  revalidatePath("/portal/settings");
  return { success: true, data: undefined };
}

export async function inviteTeamMember(
  data: { email: string; name: string; role: "CLIENT_ADMIN" | "CLIENT_MEMBER" }
): Promise<ActionResult<{ id: string }>> {
  const { session } = await requireClientAdmin();

  const parsed = inviteTeamMemberSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { success: false, error: "Un utilisateur avec cet email existe deja" };
  }

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        role: parsed.data.role,
        companyId: session.companyId,
      },
    });

    await tx.account.create({
      data: {
        accountId: newUser.id,
        providerId: "credential",
        userId: newUser.id,
        password: "", // Placeholder — user will set via reset flow
      },
    });

    return newUser;
  });

  revalidatePath("/portal/settings");
  return { success: true, data: { id: user.id } };
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  const { session, user: admin } = await requireClientAdmin();

  if (session.user.id === userId) {
    return { success: false, error: "Vous ne pouvez pas vous retirer vous-meme" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true, role: true },
  });

  if (!target) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  if (target.companyId !== admin.companyId) {
    return { success: false, error: "Cet utilisateur n'appartient pas a votre entreprise" };
  }

  if (target.role !== "CLIENT_ADMIN" && target.role !== "CLIENT_MEMBER") {
    return { success: false, error: "Impossible de retirer cet utilisateur" };
  }

  // Prevent removing the last CLIENT_ADMIN
  if (target.role === "CLIENT_ADMIN") {
    const adminCount = await prisma.user.count({
      where: { companyId: admin.companyId, role: "CLIENT_ADMIN" },
    });
    if (adminCount <= 1) {
      return { success: false, error: "Impossible de retirer le dernier administrateur de l'entreprise" };
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { companyId: null, role: "CLIENT_MEMBER" },
  });

  revalidatePath("/portal/settings");
  return { success: true, data: undefined };
}

export async function updateMemberRole(
  userId: string,
  role: "CLIENT_ADMIN" | "CLIENT_MEMBER"
): Promise<ActionResult> {
  const { session, user: admin } = await requireClientAdmin();

  if (session.user.id === userId) {
    return { success: false, error: "Vous ne pouvez pas modifier votre propre role" };
  }

  const roleSchema = z.enum(["CLIENT_ADMIN", "CLIENT_MEMBER"]);
  const parsed = roleSchema.safeParse(role);
  if (!parsed.success) {
    return { success: false, error: "Role invalide" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, companyId: true },
  });

  if (!target) {
    return { success: false, error: "Utilisateur introuvable" };
  }

  if (target.companyId !== admin.companyId) {
    return { success: false, error: "Cet utilisateur n'appartient pas a votre entreprise" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data },
  });

  revalidatePath("/portal/settings");
  return { success: true, data: undefined };
}
