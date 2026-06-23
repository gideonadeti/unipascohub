import { z } from "zod";

const _requiredVars = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_UPLOAD_PRESET",
] as const;

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
  CLOUDINARY_UPLOAD_PRESET: z
    .string()
    .min(1, "CLOUDINARY_UPLOAD_PRESET is required"),
});

let validated = false;

export function validateEnv(): void {
  if (validated) return;
  validated = true;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Missing required environment variables:\n${missing}`);
  }
}
