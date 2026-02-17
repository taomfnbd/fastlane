"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-server";
import { createCompanySchema, updateCompanySchema } from "@/types";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export async function createCompany(formData: FormData): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();

  const parsed = createCompanySchema.safeParse({
    name: formData.get("name"),
    website: formData.get("website") || undefined,
    industry: formData.get("industry") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { name, website, industry, description } = parsed.data;

  const company = await prisma.company.create({
    data: {
      name,
      website: website || null,
      industry: industry || null,
      description: description || null,
    },
  });

  revalidatePath("/admin/companies");
  revalidatePath("/admin/dashboard");

  return { success: true, data: { id: company.id } };
}

export async function updateCompany(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = updateCompanySchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    website: formData.get("website") || undefined,
    industry: formData.get("industry") || undefined,
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }

  const { id, name, website, industry, description } = parsed.data;

  await prisma.company.update({
    where: { id },
    data: {
      name,
      website: website || null,
      industry: industry || null,
      description: description || null,
    },
  });

  revalidatePath("/admin/companies");
  revalidatePath(`/admin/companies/${id}`);

  return { success: true, data: undefined };
}

export async function deleteCompany(companyId: string): Promise<ActionResult> {
  await requireAdmin();

  await prisma.company.delete({ where: { id: companyId } });

  revalidatePath("/admin/companies");
  revalidatePath("/admin/dashboard");

  return { success: true, data: undefined };
}
