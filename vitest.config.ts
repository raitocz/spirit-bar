import path from "path";
import {
  defineWorkersConfig,
  readD1Migrations,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig(async () => {
  const migrationsPath = path.join(__dirname, "migrations");
  const migrations = await readD1Migrations(migrationsPath);

  return {
    test: {
      setupFiles: ["./test/setup.ts"],
      poolOptions: {
        workers: {
          wrangler: { configPath: "./wrangler.toml" },
          isolatedStorage: false,
          miniflare: {
            bindings: {
              JWT_SECRET: "test-secret",
              RESEND_API_KEY: "test-key",
              TEST_MIGRATIONS: migrations,
            },
          },
        },
      },
    },
  };
});
