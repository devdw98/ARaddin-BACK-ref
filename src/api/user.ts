import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import { IUser } from '../models/user';
import { checkFirebase } from '../utils/firebase';
import * as UserDao from '../dao/user';
import { photoPath } from '../vars';
import multer from 'multer';
import fs from 'fs';
import { photoEncodingAIServer, isUserAIServer } from '../utils/axiosUtils';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, photoPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

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
    const userPhotoPath = email.split('@')[0];
    const user: IUser = { email, nickname, photoPath: userPhotoPath };
    let isExisted = await UserDao.findAndUpdate(user);
    if (!isExisted) {
      // 기존 사용자 없음
      const isEnrolled = await UserDao.insert(user);
      logger.info(`POST /user | CREATE USER ${nickname} - ${isEnrolled}`);
    } else {
      logger.info(`POST /user | LOGIN USER ${nickname}`);
    }
    // photos upload + AI server encoding photos
    const files = req.files as Express.Multer.File[];
    const isUpload = uploadPhotos(userPhotoPath, files);
    if (!isUpload) {
      return res
        .status(400)
        .json({ success: false, msg: 'Failed photo upload' });
    }
    // const aiServerResponse = await photoEncodingAIServer(userPhotoPath);
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

function uploadPhotos(userPhotoPath: string, files: Express.Multer.File[]) {
  try {
    const filenames = files.map((f) =>
      f.fieldname === 'photos' ? f.filename : null
    );
    !fs.existsSync(`${photoPath}/${userPhotoPath}`) &&
      fs.mkdirSync(`${photoPath}/${userPhotoPath}`);
    for (const name in filenames) {
      const oldname = `${photoPath}/${filenames[name]}`;
      const newname = `${photoPath}/${userPhotoPath}/${userPhotoPath}-${name}.jpg`;
      fs.rename(oldname, newname, function (err) {
        if (err) throw err;
      });
    }
    return true;
  } catch (e) {
    logger.error(e);
    return false;
  }
}

const router = express.Router();
router.post('/', [upload.array('photos')], login);
export { router as userRouter };
