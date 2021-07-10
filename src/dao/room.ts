import { IRoom, ISetting, Place } from '../models/room';
import { firestore } from '../app';
import { IUser } from '../models/user';
import logger from '../utils/logger';

const collection = `rooms`;

function getRandomCode() {
  const code =
    Math.random().toString(36).substring(7, 10) +
    Math.random().toString(36).substring(2, 5);
  return code;
}

async function insert(master: IUser) {
  try {
    const ref = firestore.collection(collection);
    const setting: ISetting = {
      goal: 10,
      timeLimit: 10,
      place: Place.UP,
    };
    const info: IRoom = {
      code: getRandomCode(),
      master: master,
      users: [master],
      setting: setting,
    };
    const doc = await ref.doc(info.code).set(info);
    const result = {
      code: info.code,
      room: (await ref.doc(info.code).get()).data(),
    };
    return result;
    // return doc.writeTime.toDate().getMinutes() === new Date().getMinutes();
  } catch (e) {
    logger.error(e);
  }
}
async function find(code: string) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(code).get();
    if (!doc.exists) {
      return null; //방 없음
    }
    const data = await doc.data();
    const room: IRoom = {
      code: code,
      master: data.master,
      users: data.users,
      setting: data.setting,
    };
    return room;
  } catch (e) {
    logger.error(e);
  }
}

async function update(
  code: string,
  setting?: ISetting,
  users?: IUser[],
  master?: IUser
) {
  try {
    const ref = firestore.collection(collection);
    const obj: any = {}; //timestamp: new Date()
    if (setting) {
      obj.setting = setting;
    }
    if (users) {
      obj.users = users;
    }
    if (master) {
      obj.master = master;
      obj.users = users;
    }
    const doc = await ref.doc(code).update(obj);
    // console.log((await ref.doc(code).get()).data());
    return !!doc.writeTime.toDate() ? (await ref.doc(code).get()).data() : null;
  } catch (e) {
    logger.error(e);
    return e;
  }
}

async function deleteRoom(code: string) {
  try {
    const ref = firestore.collection(collection);
    const doc = await ref.doc(code).delete();
    return !!doc.writeTime;
  } catch (e) {
    logger.error(e);
  }
}

export { insert, find, update, deleteRoom };
