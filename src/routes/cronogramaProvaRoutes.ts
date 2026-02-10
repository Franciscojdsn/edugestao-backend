import { Router } from 'express';
import { cronogramaProvaController } from '../controllers/cronogramaProvaController';
import { authMiddleware } from '../middlewares/auth';
import { contextMiddleware } from '../middlewares/contextMiddleware';
import { validate } from '../middlewares/validate';
import {
    criarCronogramaSchema,
    copiarCronogramaSchema,
    portalResponsavelSchema
} from '../schemas/cronogramaProvaSchemas';

const router = Router();

router.use(authMiddleware);
router.use(contextMiddleware);

// Criar cronograma para uma turma (Ex: Semana de Provas do 1º Trimestre)
router.post('/', validate(criarCronogramaSchema), cronogramaProvaController.create);

// Replicar o cronograma de uma turma para outras (Ex: do 9º A para 9º B e C)
router.post('/copiar', validate(copiarCronogramaSchema), cronogramaProvaController.copiar);

// Visualização para pais e alunos
router.get('/portal/:turmaId', validate(portalResponsavelSchema), cronogramaProvaController.portalResponsavel);

export { router as cronogramaProvaRoutes };