import { z } from "zod";

export const signUpSchema = z.object({
  displayName: z.string().trim().min(2, "Enter at least 2 characters").max(60),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});
export type SignUpInput = z.infer<typeof signUpSchema>;

export const logInSchema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LogInInput = z.infer<typeof logInSchema>;
