import fs from 'fs';
import multer from 'multer';
import logger from '../utils/logger';
import { rootPhotoPath, userPhotoPath, roomPhotoPath } from '../vars';

export const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dirPath = rootPhotoPath + userPhotoPath;
    const isExisted = fs.existsSync(dirPath);
    if (!isExisted) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    cb(null, dirPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.originalname}`);
  },
});
export const uploadUser = multer({ storage: userStorage });

export function uploadPhotos(
  rootPhotoPath: string,
  photoPath: string,
  files: Express.Multer.File[]
) {
  try {
    const dirPath = `${rootPhotoPath}`;
    const userPath = `${dirPath}/${photoPath}`;
    const filenames = files.map((f) =>
      f.fieldname === 'photos' ? f.filename : null
    );
    const isExisted = fs.existsSync(userPath);
    if (!isExisted) {
      fs.mkdirSync(userPath, { recursive: true });
    }
    for (const name in filenames) {
      const oldname = `${dirPath}/${filenames[name]}`;
      const newname = `${userPath}/${photoPath}-${name}.jpg`;
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
