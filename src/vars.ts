import * as yup from 'yup';
import * as dotenv from 'dotenv';

dotenv.config({
  path: process.env.NODE_ENV === 'production' ? undefined : '.env',
});

export const { firebaseFile, photoPath } = yup
  .object({
    firebaseFile: yup.string().required(),
    photoPath: yup.string(),
  })
  .validateSync(process.env);
