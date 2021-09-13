import fs from 'fs';
import multer from 'multer';
import logger from '../utils/logger';
import { rootPhotoPath, userPhotoPath, roomPhotoPath } from '../vars';

const userStorage = multer.diskStorage({
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

const roomStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dirPath = rootPhotoPath + roomPhotoPath;
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
export const uploadRoom = multer({ storage: roomStorage });

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
    logger.error(e.message);
    return false;
  }
}

export function copyDirectory(code: string, nickname: string){
  try{
    const userPath = `${rootPhotoPath}${userPhotoPath}/${nickname}`;
    const roomPath = `${rootPhotoPath}${roomPhotoPath}/${code}`;
    const userRoomPath = roomPath+`/${nickname}`;
    const isExisted = fs.existsSync(roomPath);
    if(!isExisted){
      fs.mkdirSync(roomPath, {recursive: true});
    }
    fs.mkdir(userRoomPath,(res)=>{
        // fs.copyFileSync(userPath, )
        const filenames = fs.readdirSync(userPath);
      for(const filename of filenames){
        if(filename.includes(".npy")){
          fs.copyFileSync(`${userPath}/${filename}`, `${userRoomPath}/${filename}`);
        }
      }
    })
    

  }catch(e){
    logger.error(e.message);
    return false;
  }

}