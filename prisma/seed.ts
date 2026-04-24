import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed completo para testes de funcionalidades...\n')

  // --- LIMPEZA (Ordem importa) ---
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
  console.log('✅ Banco limpo!')

  // 1. ESCOLA
  const escola = await prisma.escola.create({
    data: {
      nome: 'Colégio Exemplo Digital',
      cnpj: '12.345.678/0001-90',
      mensalidadePadrao: 500.00,
      diaVencimento: 10,
    },
  })

  // 2. ENDEREÇO ÚNICO (Conforme solicitado)
  const enderecoComum = await prisma.endereco.create({
    data: {
      rua: 'Avenida da Educação',
      numero: '100',
      bairro: 'Centro',
      cidade: 'Recife',
      estado: 'PE',
      cep: '50000-000',
    },
  })

  // 3. USUÁRIOS
  const senhaHash = await bcrypt.hash('admin123', 10)
  await prisma.usuario.create({
    data: {
      email: 'admin@escola.com',
      senha: senhaHash,
      nome: 'Diretor Geral',
      role: 'ADMIN',
      escolaId: escola.id,
    },
  })

  // 4. FUNCIONÁRIOS (3 funcionários, sendo 1 professor)
  const professor = await prisma.funcionario.create({
    data: { 
      nome: 'João Professor', 
      cargo: 'PROFESSOR', 
      escolaId: escola.id, 
      email: 'joao.prof@escola.com', 
      cpf: '11122233344', 
      salarioBase: 3500,
    }
  })

  await prisma.funcionario.create({
    data: { 
      nome: 'Maria Secretaria', 
      cargo: 'SECRETARIA', 
      escolaId: escola.id, 
      email: 'maria.sec@escola.com', 
      cpf: '55566677788', 
      salarioBase: 2200,
    }
  })

  await prisma.funcionario.create({
    data: { 
      nome: 'Carlos Financeiro', 
      cargo: 'DIRETOR', 
      escolaId: escola.id, 
      email: 'carlos.fin@escola.com', 
      cpf: '99900011122', 
      salarioBase: 2800,
    }
  })

  // 5. TURMAS (2 turmas)
  const turmaA = await prisma.turma.create({
    data: {
      nome: '1º Ano A',
      turno: 'MATUTINO',
      anoLetivo: 2026,
      escolaId: escola.id,
    },
  })
  const turmaB = await prisma.turma.create({
    data: {
      nome: '2º Ano B',
      turno: 'VESPERTINO',
      anoLetivo: 2026,
      escolaId: escola.id,
    },
  })

  // 6. DISCIPLINAS E VÍNCULOS
  const disciplinaMat = await prisma.disciplina.create({ data: { nome: 'Matemática', cargaHoraria: 4, escolaId: escola.id } })
  
  // Vincula o único professor às duas turmas
  await prisma.turmaDisciplina.createMany({
    data: [
      {
        turmaId: turmaA.id,
        disciplinaId: disciplinaMat.id,
        professorId: professor.id,
      },
      {
        turmaId: turmaB.id,
        disciplinaId: disciplinaMat.id,
        professorId: professor.id,
      },
    ],
  })

  // 7. ATIVIDADES EXTRAS (2 atividades)
  const futsal = await prisma.atividadeExtra.create({
    data: { nome: 'Futsal', valor: 80.00, escolaId: escola.id }
  })
  const ballet = await prisma.atividadeExtra.create({
    data: { nome: 'Ballet', valor: 100.00, escolaId: escola.id }
  })

  // 8. ALUNOS, RESPONSÁVEIS, NOTAS E FREQUÊNCIA
  const criarAlunoFluxoCompleto = async (
    nome: string,
    turmaId: string,
    statusFinanceiro: 'PAGO' | 'ATRASADO'
  ) => {
    const aluno = await prisma.aluno.create({
      data: {
        nome,
        numeroMatricula: `MAT-${Math.floor(Math.random() * 9000)}`,
        escolaId: escola.id,
        turmaId: turmaId,
        enderecoId: enderecoComum.id,
      }
    })

    const resp = await prisma.responsavel.create({
      data: {
        nome: `Responsável de ${nome}`,
        tipo: 'PAI',
        cpf: `000.000.000-${Math.floor(Math.random() * 99)}`,
        telefone1: '81988887777',
        email: `resp.${nome.toLowerCase().replace(' ', '')}@teste.com`,
        alunoId: aluno.id,
        escolaId: escola.id,
        isResponsavelFinanceiro: true,
        enderecoId: enderecoComum.id,
      }
    })

    await prisma.contrato.create({
      data: {
        alunoId: aluno.id,
        responsavelFinanceiroId: resp.id,
        escolaId: escola.id,
        valorMensalidadeBase: 500.00,
        diaVencimento: 10,
        dataInicio: new Date('2026-01-01'),
        status: 'ATIVO', 
        ativo: true,
      }
    })

    // Cria um boleto para simular o status
    await prisma.boletos.create({
      data: {
        referencia: statusFinanceiro === 'ATRASADO' ? 'Fevereiro/2026' : 'Maio/2026',
        mesReferencia: statusFinanceiro === 'ATRASADO' ? 2 : 5,
        anoReferencia: 2026,
        valorBase: 500.00,
        valorAtividades: 0,
        valorTotal: 500.00,
        dataVencimento: statusFinanceiro === 'ATRASADO' ? new Date('2026-02-10') : new Date('2026-05-10'),
        status: statusFinanceiro === 'ATRASADO' ? 'PENDENTE' : 'PAGO',
        alunoId: aluno.id,
        escolaId: escola.id,
      },
    })

    // Acadêmico: 1 Nota e 1 Frequência para cada aluno
    await prisma.nota.create({
      data: {
        bimestre: 1,
        anoLetivo: 2026,
        valor: statusFinanceiro === 'PAGO' ? 9.5 : 6.0,
        alunoId: aluno.id,
        turmaId: turmaId,
        disciplinaId: disciplinaMat.id,
      },
    })

    await prisma.frequencia.create({
      data: {
        data: new Date(),
        presente: true,
        alunoId: aluno.id,
        turmaId: turmaId,
        disciplinaId: disciplinaMat.id,
        escolaId: escola.id,
      },
    })

    return aluno
  }

  const aluno1 = await criarAlunoFluxoCompleto('Arthur Adimplente', turmaA.id, 'PAGO')
  const aluno2 = await criarAlunoFluxoCompleto('Beatriz Devedora', turmaA.id, 'ATRASADO')
  const aluno3 = await criarAlunoFluxoCompleto('Caio Devedor', turmaB.id, 'ATRASADO')

  // 9. LANÇAMENTOS (Transações avulsas)
  await prisma.transacao.create({
    data: {
      motivo: 'Venda de Uniforme - Arthur',
      valor: 150.00,
      tipo: 'ENTRADA',
      escolaId: escola.id,
    }
  })

  await prisma.lancamento.create({
    data: {
      descricao: 'Compra de Material de Limpeza',
      valor: 200.00,
      tipo: 'SAIDA',
      categoria: 'INFRAESTRUTURA',
      dataVencimento: new Date(),
      status: 'PAGO',
      escolaId: escola.id
    }
  })

  console.log('\n🚀 SEED REESTRUTURADO COM SUCESSO!')
  console.log(`- 3 Alunos criados (Arthur=Adimplente, Beatriz e Caio=Inadimplentes)`)
  console.log(`- Funcionários: 1 Professor (João), 1 Secretaria (Maria), 1 Administrativo (Carlos)`)
  console.log(`- Financeiro: Lançamentos de Receita e Despesa criados para o Dashboard.`)
  console.log(`- Endereço único compartilhado para facilitar testes de localização.`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())