import { Router } from 'express'
import { historicoEscolarController } from '../controllers/historicoEscolarController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { historicoEscolarSchema } from '../schemas/historicoEscolarSchema'

const router = Router()

router.use(authMiddleware)
router.use(contextMiddleware)

// Gera o histórico acadêmico formal (Dados do Aluno + Notas consolidada)
router.get(
    '/alunos/:alunoId', 
    validate(historicoEscolarSchema), 
    historicoEscolarController.gerar
)

// Resumo rápido: Turma atual, média geral e total de faltas
router.get(
    '/alunos/:alunoId/resumo', 
    historicoEscolarController.resumo
)

// Boletim Detalhado: Notas de todos os bimestres organizadas por ano letivo
router.get(
    '/alunos/:alunoId/boletim-completo', 
    historicoEscolarController.boletimCompleto
)

export { router as historicoEscolarRoutes }