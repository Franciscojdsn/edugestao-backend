/// <reference types="node" />
import { PrismaClient, Turno, StatusContrato, StatusPagamento, TipoResponsavel, TipoTransacao, FormaPagamento } from '@prisma/client';
import { fakerPT_BR as faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o Seed de Estresse do EduGestão...');

    await prisma.frequencia.deleteMany()

  await prisma.cronogramaProva.deleteMany()

  await prisma.gradeHoraria.deleteMany()

  await prisma.evento.deleteMany()

  await prisma.logAuditoria.deleteMany()

  await prisma.ocorrencia.deleteMany()

  await prisma.comunicado.deleteMany()

  await prisma.nota.deleteMany()

  await prisma.turmaDisciplina.deleteMany()

  await prisma.turmaProfessor.deleteMany()

  await prisma.alunoAtividadeExtra.deleteMany()

  await prisma.boletos.deleteMany()

  await prisma.transacao.deleteMany()

  await prisma.contrato.deleteMany()

  await prisma.lancamento.deleteMany()

  await prisma.responsavel.deleteMany()

  await prisma.aluno.deleteMany()

  await prisma.atividadeExtra.deleteMany()

  await prisma.disciplina.deleteMany()

  await prisma.turma.deleteMany() 

  await prisma.funcionario.deleteMany()

  await prisma.usuario.deleteMany()

  await prisma.endereco.deleteMany()

  await prisma.escola.deleteMany()

  console.log('✅ Banco limpo!');

  // 1. Criar a Escola Principal (Tenant)
  const escolaId = faker.string.uuid();
  const escola = await prisma.escola.create({
    data: {
      id: escolaId,
      nome: 'Colégio EduGestão Excellence',
      cnpj: faker.string.numeric(14),
      telefone: faker.phone.number(),
      email: 'contato@edugestao.com.br',
      mensalidadePadrao: 1200.00,
      diaVencimento: 10,
    },
  });
  console.log(`✅ Escola criada: ${escola.nome} (ID: ${escola.id})`);

  // 2. Criar Turmas Base
  const turmasData = [
    { nome: '1º Ano A - Ensino Fundamental', turno: Turno.MATUTINO, anoLetivo: 2026 },
    { nome: '2º Ano A - Ensino Fundamental', turno: Turno.MATUTINO, anoLetivo: 2026 },
    { nome: '3º Ano B - Ensino Fundamental', turno: Turno.VESPERTINO, anoLetivo: 2026 },
  ];

  const turmas = await Promise.all(
    turmasData.map(t => 
      prisma.turma.create({
        data: { ...t, escolaId: escola.id }
      })
    )
  );
  console.log(`✅ ${turmas.length} Turmas criadas.`);

  // 3. Criar Disciplinas Base
  const disciplinasNomes = ['Matemática', 'Português', 'História', 'Geografia', 'Ciências'];
  await Promise.all(
    disciplinasNomes.map(nome =>
      prisma.disciplina.create({
        data: { nome, escolaId: escola.id, cargaHoraria: 4 }
      })
    )
  );
  console.log(`✅ ${disciplinasNomes.length} Disciplinas criadas.`);

  console.log('⏳ Gerando 200 alunos com dados financeiros... Isso pode levar alguns segundos.');

  // 4. Gerar 200 Alunos com Responsáveis, Contratos e Boletos
  const totalAlunos = 200;
  
  // Utilizando loop for...of para evitar pool exhaustion no Neon com 200 transações simultâneas
  for (let i = 0; i < totalAlunos; i++) {
    const turmaSelecionada = faker.helpers.arrayElement(turmas);
    const isPago = faker.datatype.boolean(); // 50% chance de estar PAGO ou PENDENTE
    const valorMensalidade = 1200.00;

    await prisma.$transaction(async (tx) => {
      // 4.1 Criar Aluno
      const aluno = await tx.aluno.create({
        data: {
          nome: faker.person.fullName(),
          cpf: faker.string.numeric(11),
          dataNascimento: faker.date.birthdate({ min: 6, max: 18, mode: 'age' }),
          numeroMatricula: `MAT-${2026}-${faker.string.numeric(5)}`,
          turno: turmaSelecionada.turno,
          escolaId: escola.id,
          turmaId: turmaSelecionada.id,
        }
      });

      // 4.2 Criar Responsável Financeiro
      const responsavel = await tx.responsavel.create({
        data: {
          nome: faker.person.fullName(),
          cpf: faker.string.numeric(11),
          telefone1: faker.phone.number(),
          email: faker.internet.email(),
          tipo: faker.helpers.arrayElement([TipoResponsavel.PAI, TipoResponsavel.MAE, TipoResponsavel.TUTOR]),
          isResponsavelFinanceiro: true,
          alunoId: aluno.id,
          escolaId: escola.id,
        }
      });

      // 4.3 Criar Contrato
      const contrato = await tx.contrato.create({
        data: {
          valorMatricula: 300.00,
          valorMensalidadeBase: valorMensalidade,
          diaVencimento: 10,
          quantidadeParcelas: 12,
          status: StatusContrato.ATIVO,
          alunoId: aluno.id,
          responsavelFinanceiroId: responsavel.id,
          escolaId: escola.id,
        }
      });

      // 4.4 Criar Transação (se pago) e Boleto
      let transacaoId = null;

      if (isPago) {
        const transacao = await tx.transacao.create({
          data: {
            tipo: TipoTransacao.ENTRADA,
            motivo: `Mensalidade - ${faker.date.month()} - ${aluno.nome}`,
            valor: valorMensalidade,
            formaPagamento: FormaPagamento.PIX,
            escolaId: escola.id,
            responsavelId: responsavel.id,
            contratoId: contrato.id,
          }
        });
        transacaoId = transacao.id;
      }

      await tx.boletos.create({
        data: {
          referencia: `Mensalidade 01/12`,
          mesReferencia: faker.number.int({ min: 1, max: 12 }),
          anoReferencia: 2026,
          valorBase: valorMensalidade,
          valorTotal: valorMensalidade,
          valorPago: isPago ? valorMensalidade : null,
          dataVencimento: faker.date.soon({ days: 30 }),
          dataPagamento: isPago ? new Date() : null,
          status: isPago ? StatusPagamento.PAGO : StatusPagamento.PENDENTE,
          formaPagamento: isPago ? FormaPagamento.PIX : null,
          alunoId: aluno.id,
          escolaId: escola.id,
          transacaoId: transacaoId,
        }
      });
    });

    // Feedback visual a cada 50 alunos
    if ((i + 1) % 50 === 0) {
      console.log(`   ... ${i + 1} alunos gerados.`);
    }
  }

  console.log('🚀 Seed concluído com sucesso! Ambiente de homologação pronto.');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });