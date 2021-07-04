import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import User from '../models/user';
import { checkFirebase } from '../utils/firebase';
import * as UserDao from '../dao/user';
import { resourceLimits } from 'worker_threads';

const loginScheme = yup.object({
  token: yup.string().required(),
  nickname: yup.string().required(),
});

async function login(req: Request, res: Response) {
  try {
    const { token, nickname } = loginScheme.validateSync(req.body);
    const email = await checkFirebase(token);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, msg: `email isn't valid.` });
    }
    const user = new User(email, nickname);
    const isExisted = await UserDao.findAndUpdate(user);
    if (!isExisted) {
      const result = await UserDao.insert(user);
      return result
        ? res.status(201).json({
            user: {
              email: user.email,
              nickname: user.nickname,
            },
          })
        : res.status(400).json({
            success: false,
            msg: `user can't create this server.`,
          });
    }
    return res.status(200).json({
      user: {
        email: isExisted.email,
        nickname: isExisted.nickname,
      },
    });
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const router = express.Router();
router.post('/', login);

export { router as userRouter };
