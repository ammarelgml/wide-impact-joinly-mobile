import { z } from 'zod';

/**
 * Build-time configuration. Expo inlines `process.env.EXPO_PUBLIC_*` when bundling, so each
 * variable must be read with a literal property access. Values come from `.env` locally and from
 * `eas.json` profiles in EAS builds. Validated once at startup so a misconfigured build fails
 * loudly instead of calling the wrong API.
 */
const ConfigSchema = z.object({
  apiUrl: z.url().transform((url) => url.replace(/\/+$/, '')),
  googleWebClientId: z.string().endsWith('.apps.googleusercontent.com'),
  demoLoginEnabled: z.boolean(),
});

export type AppConfig = z.infer<typeof ConfigSchema>;

function loadConfig(): AppConfig {
  const result = ConfigSchema.safeParse({
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    demoLoginEnabled: process.env.EXPO_PUBLIC_DEMO_LOGIN_ENABLED === 'true',
  });
  if (!result.success) {
    const fields = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
    throw new Error(`Invalid app configuration (${fields}). Copy .env.example to .env.`);
  }
  return result.data;
}

export const config = loadConfig();
