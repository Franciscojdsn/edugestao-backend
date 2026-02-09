import { Router } from 'express';
import { cronogramaProvaController } from '../controllers/cronogramaProvaController';

const router = Router();

router.post('/', cronogramaProvaController.create);
router.post('/copiar', cronogramaProvaController.copiar);
router.get('/portal/:turmaId', cronogramaProvaController.portalResponsavel);

export default router;