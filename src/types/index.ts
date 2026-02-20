import { z } from "zod";

// ==================== Event Schemas ====================

export const createEventSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export const updateEventSchema = createEventSchema.extend({
  id: z.string().cuid(),
  status: z.enum(["DRAFT", "PREPARATION", "ACTIVE", "REVIEW", "COMPLETED", "ARCHIVED"]).optional(),
});

// ==================== Company Schemas ====================

export const createCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(200),
  website: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  industry: z.string().max(100).optional(),
  description: z.string().max(2000).optional(),
});

export const updateCompanySchema = createCompanySchema.extend({
  id: z.string().cuid(),
});

// ==================== User Schemas ====================

export const inviteUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Must be a valid email"),
  role: z.enum(["ADMIN", "CLIENT_ADMIN", "CLIENT_MEMBER"]),
  companyId: z.string().cuid().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ==================== Strategy Schemas ====================

export const createStrategySchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  eventCompanyId: z.string().cuid(),
});

export const updateStrategySchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

export const createStrategyItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  strategyId: z.string().cuid(),
});

export const updateStrategyItemSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
});

export const updateStrategyItemStatusSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["APPROVED", "REJECTED", "MODIFIED"]),
});

// ==================== Deliverable Schemas ====================

export const createDeliverableSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  type: z.enum([
    "EMAIL_TEMPLATE",
    "LANDING_PAGE",
    "SOCIAL_POST",
    "SCRIPT",
    "DOCUMENT",
    "AD_CREATIVE",
    "OTHER",
  ]),
  eventCompanyId: z.string().cuid(),
});

export const updateDeliverableSchema = z.object({
  id: z.string().cuid(),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  type: z.enum([
    "EMAIL_TEMPLATE",
    "LANDING_PAGE",
    "SOCIAL_POST",
    "SCRIPT",
    "DOCUMENT",
    "AD_CREATIVE",
    "OTHER",
  ]),
  content: z.string().max(50000).optional(),
});

// ==================== Comment Schemas ====================

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
  strategyId: z.string().cuid().optional(),
  strategyItemId: z.string().cuid().optional(),
  deliverableId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
});

export const createQuestionSchema = z.object({
  content: z.string().min(1, "Question cannot be empty").max(5000),
  targetCompanyId: z.string().cuid(),
  strategyId: z.string().cuid().optional(),
  deliverableId: z.string().cuid().optional(),
  strategyItemId: z.string().cuid().optional(),
});

export const answerQuestionSchema = z.object({
  id: z.string().cuid(),
  answer: z.string().min(1, "Answer cannot be empty").max(5000),
});

// ==================== Action Result ====================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
