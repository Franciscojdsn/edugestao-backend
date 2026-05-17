import pkgPg from 'pg';
const { Pool } = pkgPg;
import pkgBcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const bcrypt = pkgBcrypt;

// OBRIGATÓRIO: Conexão direta para ignorar limitações de poolers (ex: PgBouncer)
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
  throw new Error("❌ [CRITICAL-SEC] DIRECT_URL não definida no .env. Impossível rodar seed com segurança.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const { fakerPT_BR: faker } = await import('@faker-js/faker');

  console.log('🚀 Iniciando Deploy de Estado (Seed) - 5 Tenants Isolados...');

  // 1. HARD RESET
  // O deleteMany na entidade raiz (Escola) propagará um CASCADE agressivo,
  // limpando TODAS as tabelas dependentes, garantindo integridade e ausência de orphans.
  console.log('🧹 Executando DROP CASCADE Lógico...');
  await prisma.escola.deleteMany();

  const senhaAdminHash = await bcrypt.hash('SecOps@2026', 10);
  const QTD_ESCOLAS = 5;
  const QTD_ALUNOS_POR_ESCOLA = 15;

  for (let i = 1; i <= QTD_ESCOLAS; i++) {
    const escolaId = faker.string.uuid();
    const mensalidadeBase = Number(faker.finance.amount({ min: 800, max: 2500, dec: 2 }));

    // --- A. CRIAR TENANT (ESCOLA) ---
    await prisma.escola.create({
      data: {
        id: escolaId,
        nome: `Colégio EduGestão - Unidade ${i} ${faker.location.city()}`,
        cnpj: faker.string.numeric(14),
        telefone: faker.string.numeric(11),
        email: `contato@unidade${i}.edugestao.com.br`,
        mensalidadePadrao: mensalidadeBase,
        diaVencimento: 10,
      },
    });

    // --- B. CRIAR ADMIN DO TENANT ---
    await prisma.usuario.create({
      data: {
        id: faker.string.uuid(),
        email: `admin@unidade${i}.com.br`,
        senha: senhaAdminHash,
        nome: `Admin Unidade ${i}`,
        role: 'ADMIN',
        escolaId, // 🛡️ MULTI-TENANT LOCK
      },
    });

    // --- C. ESTRUTURA ACADÊMICA ---
    const turmaId = faker.string.uuid();
    await prisma.turma.create({
      data: {
        id: turmaId,
        nome: `${faker.number.int({ min: 1, max: 9 })}º Ano - Turma A`,
        turno: 'MANHA',
        anoLetivo: 2026,
        capacidadeMaxima: 30,
        escolaId, // 🛡️ MULTI-TENANT LOCK
      },
    });

    const atividadeExtraId = faker.string.uuid();
    await prisma.atividadeExtra.create({
      data: {
        id: atividadeExtraId,
        nome: 'Robótica Avançada',
        valor: 150.00,
        escolaId, // 🛡️ MULTI-TENANT LOCK
      },
    });

    console.log(`\n🏢 [Tenant ${i}] Escola estruturada. Gerando alunos e motor financeiro...`);

    // --- D. POPULAR ALUNOS E MOTOR FINANCEIRO ---
    for (let j = 1; j <= QTD_ALUNOS_POR_ESCOLA; j++) {
      const alunoId = faker.string.uuid();
      const responsavelId = faker.string.uuid();
      const contratoId = faker.string.uuid();
      
      // 1. Aluno
      await prisma.aluno.create({
        data: {
          id: alunoId,
          nome: faker.person.fullName(),
          cpf: faker.string.numeric(11),
          numeroMatricula: `26.${i}${j.toString().padStart(3, '0')}`,
          turmaId,
          escolaId, // 🛡️ MULTI-TENANT LOCK
        },
      });

      // 2. Responsável Financeiro
      await prisma.responsavel.create({
        data: {
          id: responsavelId,
          nome: faker.person.fullName(),
          cpf: faker.string.numeric(11),
          telefone1: faker.string.numeric(11),
          email: faker.internet.email().toLowerCase(),
          tipo: 'MAE',
          isResponsavelFinanceiro: true,
          alunoId,
          escolaId, // 🛡️ MULTI-TENANT LOCK
        },
      });

      // 3. Contrato Financeiro (A Base de Tudo)
      await prisma.contrato.create({
        data: {
          id: contratoId,
          alunoId,
          responsavelFinanceiroId: responsavelId,
          valorMensalidadeBase: mensalidadeBase,
          diaVencimento: 10,
          anoFaturamento: 2026,
          mesesFaturamento: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          status: 'ATIVO',
          escolaId, // 🛡️ MULTI-TENANT LOCK
        },
      });

      // 4. Simular cenário real: Mensalidade Paga vs Pendente vs Vencida
      const statusList = ['PAGO', 'PENDENTE', 'VENCIDO'] as const;
      const statusSorteado = statusList[faker.number.int({ min: 0, max: 2 })];

      const boletoId = faker.string.uuid();
      await prisma.boletos.create({
        data: {
          id: boletoId,
          alunoId,
          mesReferencia: faker.number.int({ min: 1, max: 5 }),
          anoReferencia: 2026,
          valorBase: mensalidadeBase,
          valorTotal: mensalidadeBase,
          valorPago: statusSorteado === 'PAGO' ? mensalidadeBase : null,
          dataVencimento: faker.date.future(),
          dataPagamento: statusSorteado === 'PAGO' ? new Date() : null,
          status: statusSorteado,
          escolaId, // 🛡️ MULTI-TENANT LOCK
        },
      });

      // 5. Motor Financeiro: Criar Transação SE e SOMENTE SE estiver Pago
      if (statusSorteado === 'PAGO') {
        const transacaoId = faker.string.uuid();
        await prisma.transacao.create({
          data: {
            id: transacaoId,
            tipo: 'ENTRADA',
            motivo: `Mensalidade Paga - Aluno ${alunoId.substring(0, 5)}`,
            valor: mensalidadeBase,
            responsavelId,
            contratoId,
            formaPagamento: 'PIX',
            escolaId, // 🛡️ MULTI-TENANT LOCK
          },
        });

        // 6. Auditoria Estrita (SecOps)
        await prisma.history.create({
          data: {
            id: faker.string.uuid(),
            tabela: 'transacoes',
            registroId: transacaoId,
            acao: 'CREATE',
            usuarioId: (await prisma.usuario.findFirst({ where: { escolaId } }))!.id,
            transacaoId,
          }
        });
      }
    }
  }

  console.log('✅ [SUCCESS] Infraestrutura Múltipla semeada com precisão. Contratos e Logs Financeiros integrados.');
}

main()
  .catch((e) => {
    console.error("❌ [FATAL ERROR] Falha Crítica no Seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });