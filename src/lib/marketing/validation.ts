import { z } from "zod";

export const leadFormSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z
      .string()
      .max(200)
      .default(""),
    phone: z
      .string()
      .max(30)
      .default(""),
    message: z
      .string()
      .max(1000, "Message is too long")
      .optional(),
    projectInterest: z
      .string()
      .max(100)
      .optional(),
    smsConsent: z.boolean(),
    emailConsent: z.boolean(),
    source: z
      .string()
      .max(50)
      .optional(),
  })
  .refine(
    (data) => data.email.length > 0 || data.phone.length > 0,
    { message: "Either email or phone is required", path: ["email"] }
  )
  .refine(
    (data) => data.email.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email),
    { message: "Please enter a valid email address", path: ["email"] }
  );

export type LeadFormData = z.infer<typeof leadFormSchema>;

export function validateLeadForm(data: unknown) {
  return leadFormSchema.safeParse(data);
}
