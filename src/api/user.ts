import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import { User, IUser } from '../models/user';
import { checkFirebase } from '../utils/firebase';
import * as UserDao from '../dao/user';
import { rootPhotoPath, userPhotoPath } from '../vars';
import { uploadPhotos, uploadUser } from '../utils/multerUtils';
import { photoEncodingAIServer, isUserAIServer } from '../utils/axiosUtils';

const loginScheme = yup.object({
  token: yup.string().required(),
  nickname: yup.string().required(),
  photos: yup.array(),
});

async function login(req: Request, res: Response) {
  try {
    const { token, nickname } = loginScheme.validateSync(req.body);
    const email = await checkFirebase(token);
    if (!email) {
      // 올바르지 않은 firebase token;
      return res
        .status(400)
        .json({ success: false, msg: `email isn't valid.` });
    }
    const user = new User(email, nickname);
    if (!(await UserDao.isExisted(user))) {
      // 기존 사용자 없음
      const isEnrolled = await UserDao.insert(user);
      logger.info(`POST /user | CREATE USER ${nickname} - ${isEnrolled}`);
    } else {
      const isUpdate = await UserDao.update(user);
      logger.info(`POST /user | LOGIN USER ${nickname} - ${isUpdate.nickname}`);
    }
    // photos upload + AI server encoding photos
    const files = req.files as Express.Multer.File[];
    const isUpload = uploadPhotos(
      rootPhotoPath + userPhotoPath,
      user.photoPath,
      files
    );
    if (!isUpload) {
      return res
        .status(400)
        .json({ success: false, msg: 'Failed photo upload' });
    }
    // const aiServerResponse = await photoEncodingAIServer(
    //   rootPhotoPath + userPhotoPath + '/' + photoPath
    // );
    // if (aiServerResponse === 201) {
    return res.status(201).json({
      user: {
        email: user.email,
        nickname: user.nickname,
      },
    });
    // } else {
    //   return res.status(400).json({
    //     success: false,
    //     msg: 'Failed photo upload AI Server',
    //   });
    // }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const router = express.Router();
router.post('/', [uploadUser.array('photos')], login);
export { router as userRouter };
