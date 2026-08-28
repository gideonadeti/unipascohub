import { z } from "zod";

const _requiredVars = [
  "DATABASE_URL",
  "CLERK_SECRET_KEY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_UPLOAD_PRESET",
] as const;

// Alternative to the three individual Cloudinary vars, e.g.
// cloudinary://API_KEY:API_SECRET@CLOUD_NAME (see .env.example).
const CLOUDINARY_URL_PATTERN = /^cloudinary:\/\/[^:]+:[^@]+@[^/?:#]+/;

const envSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
    CLOUDINARY_URL: z.string().optional(),
    CLOUDINARY_UPLOAD_PRESET: z
      .string()
      .min(1, "CLOUDINARY_UPLOAD_PRESET is required"),
  })
  .superRefine((env, ctx) => {
    const cloudinaryVars = [
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ] as const;

    const hasIndividualVars = cloudinaryVars.every((name) => env[name]);
    const hasUrl = Boolean(env.CLOUDINARY_URL);

    if (!hasIndividualVars && !hasUrl) {
      for (const name of cloudinaryVars) {
        ctx.addIssue({
          code: "custom",
          path: [name],
          message: `${name} is required (or set CLOUDINARY_URL)`,
        });
      }
      return;
    }

    if (hasUrl && !CLOUDINARY_URL_PATTERN.test(env.CLOUDINARY_URL ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["CLOUDINARY_URL"],
        message:
          "CLOUDINARY_URL must be in the format cloudinary://API_KEY:API_SECRET@CLOUD_NAME",
      });
    }
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
