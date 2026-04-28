import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, StatusPagamento } from '@prisma/client';

// O Prisma Seed script precisa usar a conexão direta para inserções em massa
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("❌ [CRITICAL] DIRECT_URL não definida. Verifique seu arquivo .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    const { fakerPT_BR: faker } = await import('@faker-js/faker');

    console.log('🚀 Iniciando Seed de Estresse - EduGestão (Prisma 7)');

    const escolaId = faker.string.uuid();

    // 1. Tenant Principal (Escola)
    const escola = await prisma.escola.create({
        data: {
            id: escolaId,
            nome: 'Colégio EduGestão High-Performance',
            cnpj: faker.string.numeric(14), // Máximo 14 caracteres pelo schema
        },
    });
    console.log(`✅ Tenant criado: ${escola.nome} | ID: ${escola.id}`);

    // 2. Turmas Pedagógicas
    const turmas = await Promise.all(['1º Ano Ensino Médio', '2º Ano Ensino Médio'].map(nome =>
        prisma.turma.create({
            data: {
                id: faker.string.uuid(),
                nome,
                anoLetivo: 2026,
                turno: 'MANHA', // Mapeado do enum Turno
                escolaId
            }
        })
    ));
    console.log(`✅ ${turmas.length} Turmas criadas.`);

    console.log('⏳ Gerando 200 alunos, responsáveis, contratos e boletos. Aguarde...');

    // 3. Batch de Alunos com Relacionamentos Dependentes
    for (let i = 0; i < 200; i++) {
        const alunoId = faker.string.uuid();
        const respId = faker.string.uuid();
        const turma = faker.helpers.arrayElement(turmas);

        await prisma.$transaction(async (tx) => {
            // ORDEM CORRIGIDA: O Pai (Aluno) DEVE nascer antes do Filho (Responsável)

            // A) Criação do Aluno
            await tx.aluno.create({
                data: {
                    id: alunoId,
                    nome: faker.person.fullName(),
                    numeroMatricula: `26.${String(i + 1).padStart(4, '0')}`, // Ex: "26.0001" - Limite VarChar(7)
                    cpf: faker.string.numeric(11),
                    escolaId,
                    turmaId: turma.id
                }
            });

            // B) Criação do Responsável (Agora ele achará o alunoId)
            await tx.responsavel.create({
                data: {
                    id: respId,
                    nome: faker.person.fullName(),
                    cpf: faker.string.numeric(11),
                    isResponsavelFinanceiro: true,
                    alunoId: alunoId,
                    escolaId,
                    tipo: 'PAI' // Mapeado do enum TipoResponsavel
                }
            });

            // C) Criação do Contrato Financeiro
            await tx.contrato.create({
                data: {
                    id: faker.string.uuid(),
                    alunoId,
                    responsavelFinanceiroId: respId,
                    valorMensalidadeBase: 1200.00,
                    quantidadeParcelas: 12,
                    escolaId,
                }
            });

            // D) Geração do Livro de Recebíveis (Boletos)
            const parcelas = Array.from({ length: 12 }).map((_, idx) => ({
                id: faker.string.uuid(),
                referencia: `Parcela ${idx + 1}/12`,
                mesReferencia: idx + 1,
                anoReferencia: 2026,
                valorBase: 1200.00,
                valorTotal: 1200.00,
                dataVencimento: new Date(2026, idx, 10),
                status: (idx < 2 ? 'PAGO' : 'PENDENTE') as StatusPagamento, // Mapeado do enum StatusPagamento
                alunoId,
                escolaId,
            }));

            // Inserção em lote na tabela mapeada "boletos"
            await tx.boletos.createMany({
                data: parcelas
            });
        });

        // Feedback de CLI para o terminal não parecer travado
        if ((i + 1) % 50 === 0) {
            console.log(`   - ${i + 1} famílias processadas com sucesso...`);
        }
    }

    console.log('✅ Seed de Estresse finalizado sem violação de chaves.');
}

main()
    .catch((e) => {
        console.error('❌ [CRITICAL] O Seed falhou:', e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });