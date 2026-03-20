import { Router } from 'express';
import * as aiController from '../controllers/aiController';

const router = Router();

router.post('/chat', aiController.getChatStream);
router.post('/open-url', aiController.getOpenUrl);
router.post('/close-tab', aiController.getCloseTarget);

export default router;
