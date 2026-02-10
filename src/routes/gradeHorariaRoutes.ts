import { Router } from 'express'
import { gradeHorariaController } from '../controllers/gradeHorariaController'
import { authMiddleware } from '../middlewares/auth'
import { contextMiddleware } from '../middlewares/contextMiddleware'
import { validate } from '../middlewares/validate'
import { criarGradeSchema, listarGradeTurmaSchema } from '../schemas/gradeHorariaSchemas'

const router = Router()

router.use(authMiddleware)
router.use(contextMiddleware)

// Cadastrar novo horário na grade
router.post('/', validate(criarGradeSchema), gradeHorariaController.create)

// Listar agenda de um professor logado
router.get('/minha-agenda', gradeHorariaController.agendaProfessor)

// Listar aula que está acontecendo agora para o professor
router.get('/aula-atual', gradeHorariaController.aulaAtual)

// Listar grade completa de uma turma específica
router.get('/turma/:turmaId', validate(listarGradeTurmaSchema), gradeHorariaController.listarPorTurma)

export { router as gradeHorariaRoutes }