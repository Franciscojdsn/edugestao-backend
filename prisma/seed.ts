import 'dotenv/config';
import {
  PrismaClient,
  Turno,
  StatusContrato,
  StatusPagamento,
  TipoResponsavel,
  TipoTransacao,
  FormaPagamento,
  RoleUsuario,
  CargoFuncionario,
  StatusFuncionario
} from '@prisma/client';

// Importação compatível com o seu package.json (commonjs)
const { fakerPT_BR: faker } = require('@faker-js/faker');

const TOTAL_ALUNOS = 200;
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Stress Seed - EduGestão Pro');

  // 1. Limpeza Atômica (Ordem reversa de dependência)
  // Adicionados: usuarios, enderecos, atividades_extra para evitar erros de FK
  console.log('清理 Limpando dados antigos...');
  const tables = [
    'boletos', 'transacoes', 'contratos', 'responsaveis',
    'alunos', 'turmas_disciplinas', 'turmas_professores', 'turmas',
    'disciplinas', 'usuarios', 'funcionarios', 'enderecos', 'escolas'
  ];

  for (const table of tables) {
    try {
      await (prisma as any)[table].deleteMany();
    } catch (e) {
      // Silencia erros se a tabela estiver vazia ou não existir no mapeamento
    }
  }

  // 2. Criar Tenant (Escola)
  const escola = await prisma.escola.create({
    data: {
      nome: 'Instituto Tecnológico EduGestão',
      cnpj: faker.string.numeric(14),
      email: 'contato@edugestao.com.br',
      mensalidadePadrao: 1500.0,
      diaVencimento: 10,
    },
  });

  // 3. Criar Usuário Admin (Essencial para você conseguir logar após o seed) 
  await prisma.usuario.create({
    data: {
      nome: 'Administrador Sistema',
      email: 'admin@edugestao.com.br',
      senha: 'admin', // Idealmente usar hash bcrypt como no seu schema 
      role: RoleUsuario.ADMIN,
      escolaId: escola.id
    }
  });

  // 4. Infraestrutura de Base (Turmas e Disciplinas)
  const turmas = await Promise.all([
    prisma.turma.create({ data: { nome: '9º Ano A', turno: Turno.MATUTINO, anoLetivo: 2026, escolaId: escola.id } }),
    prisma.turma.create({ data: { nome: '1º Ano EM', turno: Turno.VESPERTINO, anoLetivo: 2026, escolaId: escola.id } }),
  ]);

  const disciplinas = await Promise.all([
    prisma.disciplina.create({ data: { nome: 'Matemática', escolaId: escola.id } }),
    prisma.disciplina.create({ data: { nome: 'Português', escolaId: escola.id } }),
  ]);

  console.log(`📡 Gerando ${TOTAL_ALUNOS} alunos com contratos e boletos...`);

  // 5. Loop de Estresse com Transações
  for (let i = 1; i <= TOTAL_ALUNOS; i++) {
    const turma = faker.helpers.arrayElement(turmas);

    // Gerar número de matrícula seguindo sua lógica: ANO + Sequencial (3 dígitos)
    const numeroMatricula = `2026${i.toString().padStart(3, '0')}`;

    await prisma.$transaction(async (tx) => {
      // Criar Endereço Compartilhado
      const endereco = await tx.endereco.create({
        data: {
          rua: faker.location.street(),
          numero: faker.location.buildingNumber(),
          bairro: faker.location.neighborhood(),
          cidade: 'Recife',
          estado: 'PE',
          cep: faker.location.zipCode('########')
        }
      });

      // Criar Aluno [cite: 180, 183]
      const aluno = await tx.aluno.create({
        data: {
          nome: faker.person.fullName(),
          cpf: faker.string.numeric(11),
          numeroMatricula: numeroMatricula,
          turno: turma.turno,
          escolaId: escola.id,
          turmaId: turma.id,
          enderecoId: endereco.id
        },
      });

      // Criar Responsável [cite: 191, 195]
      const resp = await tx.responsavel.create({
        data: {
          nome: faker.person.fullName(),
          cpf: faker.string.numeric(11),
          tipo: faker.helpers.arrayElement([TipoResponsavel.PAI, TipoResponsavel.MAE]),
          isResponsavelFinanceiro: true,
          alunoId: aluno.id,
          escolaId: escola.id,
          enderecoId: endereco.id
        },
      });

      // Criar Contrato Imutável [cite: 196, 197]
      const contrato = await tx.contrato.create({
        data: {
          valorMensalidadeBase: 1500,
          valorMatricula: 500,
          status: StatusContrato.ATIVO,
          alunoId: aluno.id,
          responsavelFinanceiroId: resp.id,
          escolaId: escola.id,
          quantidadeParcelas: 12,
          diaVencimento: 10,
        },
      });

      // Gerar 3 Boletos por aluno (Stress Test) [cite: 202, 212]
      for (let m = 1; m <= 3; m++) {
        const pago = faker.datatype.boolean();
        await tx.boletos.create({
          data: {
            referencia: `${m}/12`,
            mesReferencia: m,
            anoReferencia: 2026,
            valorBase: 1500,
            valorTotal: 1500,
            status: pago ? StatusPagamento.PAGO : StatusPagamento.PENDENTE,
            dataVencimento: new Date(2026, m, 10),
            dataPagamento: pago ? new Date() : null,
            valorPago: pago ? 1500 : null,
            alunoId: aluno.id,
            escolaId: escola.id,
          },
        });
      }
    });

    if (i % 50 === 0) console.log(`✅ ${i} registros processados...`);
  }

  console.log('✨ Seed finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });