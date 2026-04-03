// src/routes/boletoRoutes.ts
import { Router } from 'express';
import { boletoController } from '../controllers/boletoController';
import { authMiddleware } from '../middlewares/auth';
import { contextMiddleware } from '../middlewares/contextMiddleware';
// 👇 Importações da Validação
import { validate } from '../middlewares/validate';
import { liquidarBoletoSchema } from '../schemas/boletoSchemas';

const router = Router();

router.use(authMiddleware);
router.use(contextMiddleware);

// 👇 Rota protegida pela validação do Zod
router.post(
    '/:id/liquidar', 
    validate(liquidarBoletoSchema), 
    boletoController.liquidar
);

export { router as boletoRoutes };