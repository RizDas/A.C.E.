import { Router } from 'express';
import * as aiController from '../controllers/aiController';

const router = Router();

router.post('/chat', aiController.getChatStream);

export default router;
