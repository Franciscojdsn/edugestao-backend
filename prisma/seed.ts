import pkgPg from 'pg';
const { Pool } = pkgPg;
import pkgBcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const bcrypt = pkgBcrypt;

// Conexão Direta OBRIGATÓRIA para o Seed rodar sem o pooler cortar no meio
const connectionString = process.env.DIRECT_URL;

if (!connectionString) {
    throw new Error("❌ [CRITICAL] DIRECT_URL não definida no .env");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    // Dynamic import to handle ESM module in CommonJS environment
    const { fakerPT_BR: faker } = await import('@faker-js/faker');

    console.log('🚀 Iniciando Super Seed Estrutural - EduGestão...');

    // ---------------------------------------------------------
    // 0. LIMPEZA DE DADOS EXISTENTES
    // ---------------------------------------------------------
    // Como a relação com Escola está configurada com onDelete: Cascade em muitos modelos,
    // deletar as escolas limpará a maior parte dos dados vinculados.
    console.log('🧹 Limpando dados antigos...');
    await prisma.escola.deleteMany();

    // ---------------------------------------------------------
    // 1. ESCOLA E USUÁRIO ADMIN
    // ---------------------------------------------------------
    const senhaHash = await bcrypt.hash('admin123', 10);

    const escola = await prisma.escola.create({
        data: {
            id: faker.string.uuid(),
            nome: `Colégio EduGestão - Matriz`,
            cnpj: faker.string.numeric(14),
            mensalidadePadrao: 1200.00,
            diaVencimento: 10,
        },
    });

    const usuario = await prisma.usuario.upsert({
        where: { email: 'admin@escola.com' },
        update: {
            senha: senhaHash,
            nome: 'Diretor Administrativo',
            escolaId: escola.id,
        },
        create: {
            email: 'admin@escola.com',
            senha: senhaHash,
            nome: 'Diretor Administrativo',
            role: 'ADMIN',
            escolaId: escola.id,
        }
    });

    console.log(`✅ Escola e Usuário Admin criados.`);

    const escolaId = escola.id;

    // ---------------------------------------------------------
    // 2. ENDEREÇO
    // ---------------------------------------------------------
    const endereco = await prisma.endereco.create({
        data: {
            id: faker.string.uuid(),
            cep: '12345678',
            rua: faker.location.street(),
            numero: '100',
            bairro: faker.location.county(),
            cidade: faker.location.city(),
            estado: 'SP',
            escolaId,
        },
    });
    console.log(`✅ Endereço criado.`);

    // ---------------------------------------------------------
    // 3. FUNCIONÁRIO/PROFESSOR E DISCIPLINA
    // ---------------------------------------------------------
    const professor = await prisma.funcionario.create({
        data: {
            id: faker.string.uuid(),
            nome: faker.person.fullName(),
            cpf: faker.string.numeric(11),
            cargo: 'PROFESSOR',
            salarioBase: 3500.00,
            escolaId,
            enderecoId: endereco.id
        },
    });

    const disciplina = await prisma.disciplina.create({
        data: {
            id: faker.string.uuid(),
            nome: 'Matemática',
            cargaHoraria: 40,
            escolaId,
        },
    });
    console.log(`✅ Professor e Disciplina criados.`);

    // ---------------------------------------------------------
    // 4. TURMA
    // ---------------------------------------------------------
    const turma = await prisma.turma.create({
        data: {
            id: faker.string.uuid(),
            nome: `1º Ano EM`,
            anoLetivo: 2026,
            turno: 'MANHA',
            escolaId,
        },
    });
    console.log(`✅ Turma criada.`);

    // ---------------------------------------------------------
    // 5. ATIVIDADE EXTRA
    // ---------------------------------------------------------
    const atividade = await prisma.atividadeExtra.create({
        data: {
            id: faker.string.uuid(),
            nome: `Futsal`,
            valor: 150.00,
            escolaId,
        },
    });
    console.log(`✅ Atividade Extra criada.`);

    // ---------------------------------------------------------
    // 6. ALUNO, RESPONSÁVEL, CONTRATO E MATRÍCULA
    // ---------------------------------------------------------
    const alunoId = faker.string.uuid();
    const respId = faker.string.uuid();
    const numeroMatricula = '26.0002';

    await prisma.$transaction(async (tx) => {
        const aluno = await tx.aluno.create({
            data: {
                id: alunoId,
                nome: faker.person.fullName(),
                numeroMatricula: numeroMatricula,
                cpf: faker.string.numeric(11),
                dataNascimento: faker.date.birthdate({ min: 6, max: 17, mode: 'age' }),
                genero: faker.helpers.arrayElement(['MASCULINO', 'FEMININO']),
                turmaId: turma.id,
                escolaId,
                enderecoId: endereco.id
            },
        });

        await tx.responsavel.create({
            data: {
                id: respId,
                nome: faker.person.fullName(),
                cpf: faker.string.numeric(11),
                telefone1: faker.string.numeric(11),
                email: faker.internet.email(),
                isResponsavelFinanceiro: true,
                tipo: 'PAI',
                alunoId: alunoId,
                escolaId,
            },
        });

        const contrato = await tx.contrato.create({
            data: {
                id: faker.string.uuid(),
                alunoId,
                responsavelFinanceiroId: respId,
                valorMensalidadeBase: 1200.00,
                valorMatricula: 500.00,
                diaVencimento: 10,
                anoFaturamento: 2026,
                mesesFaturamento: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as any,
                escolaId,
            },
        });

        await tx.matricula.create({
            data: {
                id: faker.string.uuid(),
                numeroMatricula: numeroMatricula,
                anoLetivo: 2026,
                status: 'APROVADA',
                alunoId,
                turmaId: turma.id,
                responsavelId: respId,
                escolaId,
                contratoId: contrato.id
            }
        });
    });
    console.log(`✅ Aluno, Responsável, Contrato e Matrícula criados.`);

    // ---------------------------------------------------------
    // 7. FINANCEIRO E AUDITORIA
    // ---------------------------------------------------------
    const txId = faker.string.uuid();

    await prisma.alunoAtividadeExtra.create({
        data: {
            id: faker.string.uuid(),
            alunoId: alunoId,
            atividadeExtraId: atividade.id,
            escolaId,
        },
    });

    await prisma.boletos.create({
        data: {
            id: faker.string.uuid(),
            mesReferencia: 1,
            anoReferencia: 2026,
            valorBase: 1200.00,
            valorTotal: 1200.00,
            dataVencimento: new Date(),
            status: 'PAGO',
            alunoId: alunoId,
            escolaId,
        },
    });

    await prisma.transacao.create({
        data: {
            id: txId,
            motivo: `Mensalidade Aluno ${numeroMatricula}`,
            valor: 1200.00,
            tipo: 'ENTRADA',
            data: new Date(),
            formaPagamento: 'PIX',
            escolaId,
        },
    });

    await prisma.lancamento.create({
        data: {
            id: faker.string.uuid(),
            descricao: `Recebimento Ref: ${txId}`,
            categoria: 'MENSALIDADE',
            valor: 1200.00,
            tipo: 'ENTRADA',
            dataVencimento: new Date(),
            escolaId,
        },
    });

    await prisma.logAuditoria.create({
        data: {
            id: faker.string.uuid(),
            entidade: 'Aluno',
            acao: 'CREATE',
            entidadeId: alunoId,
            escolaId,
            usuarioId: usuario.id
        },
    });

    console.log(`✅ Fluxo Financeiro e Auditoria criados.`);
    console.log('🎉 BANCO DE DADOS POPULADO E PRONTO PARA TESTES DE AMBIENTE LIGADO!');
}

main()
    .catch((e) => {
        console.error('❌ [CRITICAL] Falha na injeção de dados. Verifique os nomes das tabelas no schema:', e);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });