import express from 'express';
import { firebaseFile } from './vars';

import { initialFirebase } from './utils/firebase';

// Create Express server
const app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// firebase
const firebase = initialFirebase(firebaseFile);
export default app;
