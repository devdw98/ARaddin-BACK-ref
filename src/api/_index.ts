import { Router } from 'express';
import { userRouter } from './user';
import { roomRouter } from './room';

const router = Router();
router.use('/user', userRouter);
router.use('/room', roomRouter);

export default router;
