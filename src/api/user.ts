import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import { IUser } from '../models/user';
import { checkFirebase } from '../utils/firebase';
import * as UserDao from '../dao/user';
import { photoPath } from '../vars';
import { UploadedFile } from 'express-fileupload';

const loginScheme = yup.object({
  token: yup.string().required(),
  nickname: yup.string().required(),
  photos: yup.array(),
});

//upload file
function uploadPhoto(userPhotoPath: string, files: UploadedFile[]) {
  const path = photoPath + userPhotoPath;
  let i = 1;
  for (const f of files) {
    if (f.truncated) {
      return false;
    }
    f.mv(path + `/photo${i}.jpg`);
    i++;
  }
  return true;
}

async function login(req: Request, res: Response) {
  try {
    const { token, nickname } = loginScheme.validateSync(req.body);
    const email = await checkFirebase(token);
    if (!email) {
      return res
        .status(400)
        .json({ success: false, msg: `email isn't valid.` });
    }
    const photoPath = email.split('@')[0];
    const user: IUser = { email, nickname, photoPath };
    const isExisted = await UserDao.findAndUpdate(user);
    if (!isExisted) {
      // 기존 사용자 없음
      const result = await UserDao.insert(user);
      logger.info(`POST /user | CREATE USER ${nickname}`);
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
    logger.info(`POST /user | LOGIN USER ${nickname}`);
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
