import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs'; // Usando bcryptjs para evitar erros de compilação no Windows
import * as dotenv from 'dotenv';

// 1. Carrega o .env
dotenv.config();

// 2. Configura a conexão exatamente como no seu prisma.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Criamos o cliente "base" sem as extensões de auditoria para evitar erro de Contexto
const prisma = new PrismaClient({ adapter });

async function reset() {
  const email = "admin@escola.com";
  const senhaPura = "senha123";

  console.log("🚀 [EduGestão] Conectando ao banco via Adapter PG...");

  try {
    // 3. Busca o usuário
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!usuario) {
      console.log(`❌ Usuário ${email} não encontrado.`);
      return;
    }

    // 4. Gera o hash com bcryptjs
    console.log("🔐 Gerando novo hash...");
    const salt = await bcrypt.genSalt(10);
    const novoHash = await bcrypt.hash(senhaPura, salt);

    // 5. Atualiza o banco
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { senha: novoHash },
    });

    console.log("------------------------------------------");
    console.log("✅ SENHA RESETADA COM SUCESSO!");
    console.log(`📧 Login: ${email}`);
    console.log(`🔑 Senha: ${senhaPura}`);
    console.log("------------------------------------------");

  } catch (error) {
    console.error("❌ Falha no reset:", error);
  } finally {
    await prisma.$disconnect();
    await pool.end(); // Fecha o pool de conexão
  }
}

reset();