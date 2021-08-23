import express from 'express';
import { firebaseFile } from './vars';
import { execPy } from './test';
import { initialFirebase } from './utils/firebase';
import router from './api/_index';

// Create Express server
const app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', router);

app.get('/', (req, res) => {
  execPy('./aiUtils/face/main.py');
  res.send('Hello World!2');
});

// firebase
const firebase = initialFirebase(firebaseFile);
export const firebaseAuth = firebase.auth();
export const firestore = firebase.firestore();
export default app;
