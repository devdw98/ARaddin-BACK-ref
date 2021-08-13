import axios from 'axios';
import { rootPhotoPath, roomPhotoPath, aiServer } from '../vars';
import logger from './logger';

export function photoEncodingAIServer(userPhotoPath: string) {
  return axios
    .post(`${aiServer}/model/encode`, {
      path: `${rootPhotoPath + userPhotoPath}/${userPhotoPath}`,
    })
    .then((response) => {
      return response.status;
    })
    .catch((err) => {
      logger.error(err.message);
      return 400;
    });
}

export function learningPhotosAIServer(code: string, userPhotoPath: string) {
  return axios
    .post(`${aiServer}/model/prepare`, {
      room_num: code,
      path: `${rootPhotoPath + userPhotoPath}/${userPhotoPath}`,
    })
    .then((response) => {
      return response.status;
    })
    .catch((err) => {
      logger.error(err.message);
      return 400;
    });
}

export function isUserAIServer(code: string) {
  return axios
    .post(`${aiServer}/model/match`, {
      room_num: code,
      path: `${rootPhotoPath}/${roomPhotoPath}/${code}`,
    })
    .then((response) => {
      return JSON.parse(response.data['data']);
    })
    .catch((err) => {
      logger.error(err.message);
      return '';
    });
}

export function deleteModelAIServer(code: string) {
  return axios
    .delete(`${aiServer}/model/${code}`)
    .then((response) => {
      return response.status;
    })
    .catch((err) => {
      logger.error(err.message);
      return 400;
    });
}
