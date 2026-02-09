import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import * as bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed atualizado com Grade e Cronogramas...\n')

  // --- LIMPEZA (Ordem importa) ---
  await prisma.frequencia.deleteMany()
  await prisma.cronogramaProva.deleteMany()
  await prisma.gradeHoraria.deleteMany()
  await prisma.evento.deleteMany()
  await prisma.nota.deleteMany()
  await prisma.turmaDisciplina.deleteMany()
  await prisma.turmaProfessor.deleteMany()
  await prisma.alunoAtividadeExtra.deleteMany()
  await prisma.boletos.deleteMany()
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

  // 2. USUÁRIOS
  const senhaHash = await bcrypt.hash('senha123', 10)
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@escola.com',
      senha: senhaHash,
      nome: 'Admin Teste',
      role: 'ADMIN',
      escolaId: escola.id,
    },
  })

  // 3. PROFESSORES (Fundamental I e II)
  const profF1 = await prisma.funcionario.create({
    data: { nome: 'Prof Regente (F1)', cargo: 'PROFESSOR', escolaId: escola.id, email: 'proff1@escola.com', cpf: '12345678901', salario: 3000 }
  })
  const profF2_Mat = await prisma.funcionario.create({
    data: { nome: 'Prof Matemática (F2)', cargo: 'PROFESSOR', escolaId: escola.id, email: 'mat@escola.com', cpf: '12345678902', salario: 3000 }
  })

  // 4. TURMAS
  const turmaF1 = await prisma.turma.create({
    data: { nome: '1º Ano (Fund I)', turno: 'MATUTINO', anoLetivo: 2026, escolaId: escola.id }
  })
  const turmaF2 = await prisma.turma.create({
    data: { nome: '6º Ano (Fund II)', turno: 'MATUTINO', anoLetivo: 2026, escolaId: escola.id }
  })

  // 5. DISCIPLINAS
  const mat = await prisma.disciplina.create({ data: { nome: 'Matemática', cargaHoraria: 5, escolaId: escola.id } })
  const port = await prisma.disciplina.create({ data: { nome: 'Português', cargaHoraria: 5, escolaId: escola.id } })

  // 6. VÍNCULOS (TurmaDisciplina) - Fundamental I tem 1 prof para tudo, II tem vários
  const tdF1_Mat = await prisma.turmaDisciplina.create({ data: { turmaId: turmaF1.id, disciplinaId: mat.id, professorId: profF1.id } })
  const tdF1_Port = await prisma.turmaDisciplina.create({ data: { turmaId: turmaF1.id, disciplinaId: port.id, professorId: profF1.id } })
  
  const tdF2_Mat = await prisma.turmaDisciplina.create({ data: { turmaId: turmaF2.id, disciplinaId: mat.id, professorId: profF2_Mat.id } })

  // 7. GRADE HORÁRIA (Para testar a chamada automática)
  // Simulando que agora é Segunda-feira, 08:00
  await prisma.gradeHoraria.create({
    data: {
      diaSemana: 1, // Segunda
      horarioInicio: '07:30',
      horarioFim: '09:00',
      turmaId: turmaF2.id,
      turmaDisciplinaId: tdF2_Mat.id,
      escolaId: escola.id
    }
  })

  // 8. ALUNOS
  const aluno = await prisma.aluno.create({
    data: { nome: 'Aluno Teste', numeroMatricula: '2026001', escolaId: escola.id, turmaId: turmaF2.id }
  })

  console.log('\n🚀 SEED COMPLETO!')
  console.log(`ID Turma F2: ${turmaF2.id}`)
  console.log(`ID Disciplina Mat: ${mat.id}`)
  console.log(`ID Aluno: ${aluno.id}`)
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())