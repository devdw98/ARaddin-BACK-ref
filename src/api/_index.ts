import { Router } from 'express';
import { userRouter } from './user';
import { roomRouter } from './room';
import { gameRouter } from './game';

const router = Router();
router.use('/user', userRouter);
router.use('/room', roomRouter);
router.use('/game', gameRouter);

export default router;
