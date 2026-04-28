import * as dotenv from "dotenv";
import path from "path";

// Garante que o .env seja carregado antes do Prisma tentar ler as URLs
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // A chave para o Prisma 7 reconhecer o comando de seed
    seed: "ts-node ./prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
});