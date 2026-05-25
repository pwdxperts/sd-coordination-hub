import { defineConfig } from "prisma/config";

// Dummy URL for build/compile purposes
// Set real DATABASE_URL env var at runtime
const DATABASE_URL = process.env["DATABASE_URL"] || "postgresql://localhost:5432/sd-hub";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: DATABASE_URL,
  },
});
