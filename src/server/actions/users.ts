"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { auth } from "@/lib/auth";
import { inviteUserSchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function inviteUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = inviteUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    companyId: formData.get("companyId") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, email, role, companyId, password } = parsed.data;

  // Check if client role has company
  if ((role === "CLIENT_ADMIN" || role === "CLIENT_MEMBER") && !companyId) {
    return { success: false, error: "Client users must be assigned to a company" };
  }

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "A user with this email already exists" };
  }

  // Create user via Better Auth
  const result = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  if (!result.user) {
    return { success: false, error: "Failed to create user" };
  }

  // Update role and company
  await prisma.user.update({
    where: { id: result.user.id },
    data: {
      role,
      companyId: companyId ?? null,
    },
  });

  revalidatePath("/admin/users");

  return { success: true, data: { id: result.user.id } };
}

export async function updateUserRole(
  userId: string,
  role: "ADMIN" | "CLIENT_ADMIN" | "CLIENT_MEMBER"
): Promise<ActionResult> {
  await requireAdmin();

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  revalidatePath("/admin/users");

  return { success: true, data: undefined };
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  const session = await requireAdmin();

  // Don't allow deleting yourself
  if (session.user.id === userId) {
    return { success: false, error: "You cannot delete your own account" };
  }

  await prisma.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");

  return { success: true, data: undefined };
}
