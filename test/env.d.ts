import type { D1Migration } from "@cloudflare/vitest-pool-workers/config";

declare module "cloudflare:test" {
  interface ProvidedEnv {
    DB: D1Database;
    PHOTOS: R2Bucket;
    JWT_SECRET: string;
    RESEND_API_KEY: string;
    ENVIRONMENT: string;
    TEST_MIGRATIONS: D1Migration[];
  }
}
