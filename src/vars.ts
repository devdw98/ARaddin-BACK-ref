import * as yup from 'yup';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? undefined : '.env',
});

export const {
  firebaseFile,
  rootPhotoPath,
  userPhotoPath,
  roomPhotoPath,
  aiServer,
} = yup
  .object({
    firebaseFile: yup.string().required(),
    rootPhotoPath: yup.string(),
    userPhotoPath: yup.string(),
    roomPhotoPath: yup.string(),
    aiServer: yup.string().default('http://localhost:8000'),
  })
  .validateSync(process.env);
