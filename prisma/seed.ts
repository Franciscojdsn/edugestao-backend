import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

// Criar pool de conexões PostgreSQL
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
})

// Criar adapter
const adapter = new PrismaPg(pool)

// Inicializar PrismaClient com adapter
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n')

  // Limpar dados existentes (ordem importante por causa das FKs)
  console.log('🗑️  Limpando dados existentes...')
  await prisma.history.deleteMany()
  await prisma.nota.deleteMany()
  await prisma.turmaDisciplina.deleteMany()
  await prisma.turmaProfessor.deleteMany()
  await prisma.alunoAtividadeExtra.deleteMany()
  await prisma.pagamento.deleteMany()
  await prisma.transacao.deleteMany()
  await prisma.contrato.deleteMany()
  await prisma.responsavel.deleteMany()
  await prisma.aluno.deleteMany()
  await prisma.atividadeExtra.deleteMany()
  await prisma.disciplina.deleteMany()
  await prisma.turma.deleteMany()
  await prisma.funcionario.deleteMany()
  await prisma.usuario.deleteMany()
  await prisma.endereco.deleteMany()
  await prisma.escola.deleteMany()
  console.log('✅ Dados limpos!\n')

  // ========================================
  // 1. CRIAR ESCOLA
  // ========================================
  console.log('🏫 Criando escola...')
  const escola = await prisma.escola.create({
    data: {
      nome: 'Colégio Exemplo Infantil',
      cnpj: '12.345.678/0001-90',
      telefone: '(81) 3333-4444',
      email: 'contato@colegioexemplo.com.br',
      mensalidadePadrao: 500.00,
      diaVencimento: 10,
    },
  })
  console.log(`✅ Escola criada: ${escola.nome}\n`)

  // ========================================
  // 2. CRIAR ENDEREÇOS
  // ========================================
  console.log('📍 Criando endereços...')
  const endereco1 = await prisma.endereco.create({
    data: {
      rua: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Recife',
      estado: 'PE',
      cep: '50000-000',
    },
  })

  const endereco2 = await prisma.endereco.create({
    data: {
      rua: 'Avenida Principal',
      numero: '456',
      complemento: 'Apt 301',
      bairro: 'Boa Viagem',
      cidade: 'Recife',
      estado: 'PE',
      cep: '51000-000',
    },
  })

  const endereco3 = await prisma.endereco.create({
    data: {
      rua: 'Rua do Colégio',
      numero: '789',
      bairro: 'Piedade',
      cidade: 'Jaboatão',
      estado: 'PE',
      cep: '54400-000',
    },
  })
  console.log('✅ 3 endereços criados\n')

  // ========================================
  // 3. CRIAR USUÁRIOS (Autenticação)
  // ========================================
  console.log('👤 Criando usuários...')
  const senhaHash = await bcrypt.hash('senha123', 10)

  const usuarioAdmin = await prisma.usuario.create({
    data: {
      email: 'admin@colegioexemplo.com.br',
      senha: senhaHash,
      nome: 'Administrador',
      role: 'ADMIN',
      escolaId: escola.id,
    },
  })

  const usuarioSecretaria = await prisma.usuario.create({
    data: {
      email: 'secretaria@colegioexemplo.com.br',
      senha: senhaHash,
      nome: 'Carla Secretária',
      role: 'SECRETARIA',
      escolaId: escola.id,
    },
  })
  console.log('✅ 2 usuários criados\n')

  // ========================================
  // 4. CRIAR FUNCIONÁRIOS/PROFESSORES
  // ========================================
  console.log('👨‍🏫 Criando funcionários...')
  const professoraMaria = await prisma.funcionario.create({
    data: {
      nome: 'Maria Silva',
      cpf: '123.456.789-01',
      telefone: '(81) 99999-1111',
      email: 'maria@colegioexemplo.com.br',
      cargo: 'PROFESSOR',
      salario: 3000.00,
      escolaId: escola.id,
      enderecoId: endereco3.id,
    },
  })

  const professorJoao = await prisma.funcionario.create({
    data: {
      nome: 'João Santos',
      cpf: '987.654.321-09',
      telefone: '(81) 99999-2222',
      email: 'joao@colegioexemplo.com.br',
      cargo: 'PROFESSOR',
      salario: 3000.00,
      escolaId: escola.id,
    },
  })
  console.log('✅ 2 professores criados\n')

  // ========================================
  // 5. CRIAR TURMAS
  // ========================================
  console.log('📚 Criando turmas...')
  const turmaMaternal = await prisma.turma.create({
    data: {
      nome: 'Maternal II',
      turno: 'MATUTINO',
      anoLetivo: 2026,
      capacidade: 20,
      escolaId: escola.id,
    },
  })

  const turma1Ano = await prisma.turma.create({
    data: {
      nome: '1º Ano A',
      turno: 'MATUTINO',
      anoLetivo: 2026,
      capacidade: 25,
      escolaId: escola.id,
    },
  })
  console.log('✅ 2 turmas criadas\n')

  // ========================================
  // 6. VINCULAR PROFESSORES ÀS TURMAS
  // ========================================
  console.log('🔗 Vinculando professores às turmas...')
  await prisma.turmaProfessor.create({
    data: {
      turmaId: turmaMaternal.id,
      professorId: professoraMaria.id,
      isPrincipal: true,
    },
  })

  await prisma.turmaProfessor.create({
    data: {
      turmaId: turma1Ano.id,
      professorId: professorJoao.id,
      isPrincipal: true,
    },
  })
  console.log('✅ Professores vinculados\n')

  // ========================================
  // 7. CRIAR DISCIPLINAS
  // ========================================
  console.log('📖 Criando disciplinas...')
  const disciplinas = await Promise.all([
    prisma.disciplina.create({
      data: {
        nome: 'Português',
        cargaHoraria: 5,
        escolaId: escola.id,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: 'Matemática',
        cargaHoraria: 5,
        escolaId: escola.id,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: 'Ciências',
        cargaHoraria: 3,
        escolaId: escola.id,
      },
    }),
    prisma.disciplina.create({
      data: {
        nome: 'História',
        cargaHoraria: 3,
        escolaId: escola.id,
      },
    }),
  ])
  console.log('✅ 4 disciplinas criadas\n')

  // ========================================
  // 8. VINCULAR DISCIPLINAS ÀS TURMAS
  // ========================================
  console.log('🔗 Vinculando disciplinas às turmas...')
  for (const disciplina of disciplinas) {
    await prisma.turmaDisciplina.create({
      data: {
        turmaId: turma1Ano.id,
        disciplinaId: disciplina.id,
      },
    })
  }
  console.log('✅ Disciplinas vinculadas ao 1º Ano A\n')

  // ========================================
  // 9. CRIAR ATIVIDADES EXTRA
  // ========================================
  console.log('⚽ Criando atividades extra...')
  const atividadeFutebol = await prisma.atividadeExtra.create({
    data: {
      nome: 'Futebol',
      descricao: 'Treino de futebol 2x por semana',
      valor: 50.00,
      escolaId: escola.id,
    },
  })

  const atividadeIngles = await prisma.atividadeExtra.create({
    data: {
      nome: 'Inglês',
      descricao: 'Aulas de inglês básico',
      valor: 80.00,
      escolaId: escola.id,
    },
  })
  console.log('✅ 2 atividades extra criadas\n')

  // ========================================
  // 10. CRIAR ALUNOS
  // ========================================
  console.log('👶 Criando alunos...')
  
  // ALUNO 1: Francisco João
  const alunoFrancisco = await prisma.aluno.create({
    data: {
      nome: 'Francisco João',
      numeroMatricula: 'MAT-2026-001',
      turno: 'MATUTINO',
      escolaId: escola.id,
      turmaId: turmaMaternal.id,
      enderecoId: endereco1.id,
    },
  })

  // Responsáveis do Francisco
  const responsavelMaeFrancisco = await prisma.responsavel.create({
    data: {
      nome: 'Danielle Nascimento da Silva',
      cpf: '111.222.333-44',
      telefone1: '(81) 98888-1111',
      tipo: 'MAE',
      isResponsavelFinanceiro: true, // Mãe é a responsável financeira
      alunoId: alunoFrancisco.id,
      enderecoId: endereco1.id, // Mesmo endereço do filho
    },
  })

  await prisma.responsavel.create({
    data: {
      nome: 'José Silva',
      cpf: '222.333.444-55',
      telefone1: '(81) 98888-2222',
      tipo: 'PAI',
      isResponsavelFinanceiro: false,
      alunoId: alunoFrancisco.id,
      enderecoId: endereco1.id,
    },
  })

  // ALUNO 2: Ana Carolina
  const alunoAna = await prisma.aluno.create({
    data: {
      nome: 'Ana Carolina Santos',
      cpf: '333.444.555-66',
      dataNascimento: new Date('2019-05-15'),
      numeroMatricula: 'MAT-2026-002',
      turno: 'MATUTINO',
      escolaId: escola.id,
      turmaId: turma1Ano.id,
      enderecoId: endereco2.id,
    },
  })

  const responsavelMaeAna = await prisma.responsavel.create({
    data: {
      nome: 'Paula Santos',
      cpf: '444.555.666-77',
      telefone1: '(81) 98888-3333',
      email: 'paula@email.com',
      tipo: 'MAE',
      isResponsavelFinanceiro: true,
      alunoId: alunoAna.id,
      enderecoId: endereco2.id,
    },
  })

  // ALUNO 3: Carlos Eduardo
  const alunoCarlos = await prisma.aluno.create({
    data: {
      nome: 'Carlos Eduardo Lima',
      cpf: '555.666.777-88',
      dataNascimento: new Date('2019-08-20'),
      numeroMatricula: 'MAT-2026-003',
      turno: 'MATUTINO',
      escolaId: escola.id,
      turmaId: turma1Ano.id,
      enderecoId: endereco2.id,
    },
  })

  const responsavelPaiCarlos = await prisma.responsavel.create({
    data: {
      nome: 'Roberto Lima',
      cpf: '666.777.888-99',
      telefone1: '(81) 98888-4444',
      tipo: 'PAI',
      isResponsavelFinanceiro: true,
      alunoId: alunoCarlos.id,
      enderecoId: endereco2.id,
    },
  })
  console.log('✅ 3 alunos criados com responsáveis\n')

  // ========================================
  // 11. VINCULAR ATIVIDADES EXTRA AOS ALUNOS
  // ========================================
  console.log('🔗 Vinculando atividades extra...')
  await prisma.alunoAtividadeExtra.create({
    data: {
      alunoId: alunoAna.id,
      atividadeExtraId: atividadeFutebol.id,
      ativo: true,
    },
  })

  await prisma.alunoAtividadeExtra.create({
    data: {
      alunoId: alunoCarlos.id,
      atividadeExtraId: atividadeIngles.id,
      ativo: true,
    },
  })
  console.log('✅ Atividades vinculadas\n')

  // ========================================
  // 12. CRIAR CONTRATOS
  // ========================================
  console.log('📄 Criando contratos...')
  await prisma.contrato.create({
    data: {
      alunoId: alunoFrancisco.id,
      responsavelFinanceiroId: responsavelMaeFrancisco.id,
      valorMensalidade: 500.00,
      diaVencimento: 10,
      dataInicio: new Date('2026-01-01'),
      ativo: true,
    },
  })

  await prisma.contrato.create({
    data: {
      alunoId: alunoAna.id,
      responsavelFinanceiroId: responsavelMaeAna.id,
      valorMensalidade: 550.00, // 500 + 50 (futebol)
      diaVencimento: 10,
      dataInicio: new Date('2026-01-01'),
      ativo: true,
    },
  })

  await prisma.contrato.create({
    data: {
      alunoId: alunoCarlos.id,
      responsavelFinanceiroId: responsavelPaiCarlos.id,
      valorMensalidade: 580.00, // 500 + 80 (inglês)
      diaVencimento: 10,
      dataInicio: new Date('2026-01-01'),
      ativo: true,
    },
  })
  console.log('✅ 3 contratos criados\n')

  // ========================================
  // 13. CRIAR PAGAMENTOS (Mensalidades)
  // ========================================
  console.log('💰 Criando pagamentos de mensalidades...')
  
  // Helper para criar mensalidades
  const criarMensalidades = async (
    alunoId: string,
    valorBase: number,
    valorAtividades: number
  ) => {
    const meses = [
      { mes: 1, nome: 'Janeiro' },
      { mes: 2, nome: 'Fevereiro' },
      { mes: 3, nome: 'Março' },
      { mes: 4, nome: 'Abril' },
    ]

    for (const { mes, nome } of meses) {
      await prisma.pagamento.create({
        data: {
          alunoId,
          referencia: `${nome}/2026`,
          mesReferencia: mes,
          anoReferencia: 2026,
          valorBase,
          valorAtividades,
          valorTotal: valorBase + valorAtividades,
          dataVencimento: new Date(`2026-${mes.toString().padStart(2, '0')}-10`),
          status: mes === 1 ? 'PAGO' : 'PENDENTE',
          dataPagamento: mes === 1 ? new Date('2026-01-21') : null,
          valorPago: mes === 1 ? valorBase + valorAtividades : null,
        },
      })
    }
  }

  await criarMensalidades(alunoFrancisco.id, 500, 0)
  await criarMensalidades(alunoAna.id, 500, 50)
  await criarMensalidades(alunoCarlos.id, 500, 80)
  console.log('✅ 12 pagamentos criados (4 meses x 3 alunos)\n')

  // ========================================
  // 14. CRIAR TRANSAÇÕES
  // ========================================
  console.log('💳 Criando transações financeiras...')
  
  // Entrada - Mensalidade paga do Francisco
  await prisma.transacao.create({
    data: {
      tipo: 'ENTRADA',
      motivo: 'Mensalidade - Janeiro/2026',
      valor: 500.00,
      data: new Date('2026-01-21'),
      escolaId: escola.id,
      responsavelId: responsavelMaeFrancisco.id,
    },
  })

  // Saída - Salário professora Maria
  await prisma.transacao.create({
    data: {
      tipo: 'SAIDA',
      motivo: 'Salário - Profª Maria Silva - Janeiro/2026',
      valor: 3000.00,
      data: new Date('2026-01-05'),
      escolaId: escola.id,
      funcionarioId: professoraMaria.id,
    },
  })

  // Saída - Conta de luz
  await prisma.transacao.create({
    data: {
      tipo: 'SAIDA',
      motivo: 'Conta de luz - Janeiro/2026',
      valor: 350.00,
      data: new Date('2026-01-15'),
      escolaId: escola.id,
    },
  })

  // Entrada - Taxa de matrícula
  await prisma.transacao.create({
    data: {
      tipo: 'ENTRADA',
      motivo: 'Taxa de matrícula - Ana Carolina',
      valor: 200.00,
      data: new Date('2026-01-10'),
      escolaId: escola.id,
      responsavelId: responsavelMaeAna.id,
    },
  })
  console.log('✅ 4 transações criadas\n')

  // ========================================
  // 15. CRIAR NOTAS (Bimestres)
  // ========================================
  console.log('📝 Criando notas do 1º bimestre...')
  
  // Notas da Ana (1º Ano A)
  for (const disciplina of disciplinas) {
    await prisma.nota.create({
      data: {
        alunoId: alunoAna.id,
        turmaId: turma1Ano.id,
        disciplinaId: disciplina.id,
        bimestre: 1,
        anoLetivo: 2026,
        valor: 8.5,
        observacao: 'Excelente participação!',
      },
    })
  }

  // Notas do Carlos (1º Ano A)
  for (const disciplina of disciplinas) {
    await prisma.nota.create({
      data: {
        alunoId: alunoCarlos.id,
        turmaId: turma1Ano.id,
        disciplinaId: disciplina.id,
        bimestre: 1,
        anoLetivo: 2026,
        valor: 7.0,
      },
    })
  }
  console.log('✅ 8 notas criadas (4 disciplinas x 2 alunos)\n')

  // ========================================
  // RESUMO FINAL
  // ========================================
  console.log('========================================')
  console.log('✅ SEED CONCLUÍDO COM SUCESSO!')
  console.log('========================================\n')
  console.log('📊 Resumo dos dados criados:')
  console.log('   • 1 Escola')
  console.log('   • 2 Usuários (admin + secretaria)')
  console.log('   • 2 Professores')
  console.log('   • 2 Turmas (Maternal II + 1º Ano A)')
  console.log('   • 4 Disciplinas')
  console.log('   • 2 Atividades Extra')
  console.log('   • 3 Alunos com responsáveis')
  console.log('   • 3 Contratos')
  console.log('   • 12 Pagamentos')
  console.log('   • 4 Transações')
  console.log('   • 8 Notas')
  console.log('   • 3 Endereços\n')
  console.log('🔑 Credenciais de acesso:')
  console.log('   Email: admin@colegioexemplo.com.br')
  console.log('   Senha: senha123\n')
  console.log('   Email: secretaria@colegioexemplo.com.br')
  console.log('   Senha: senha123\n')
}

main()
  .catch((e) => {
    console.error('❌ Erro ao executar seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
