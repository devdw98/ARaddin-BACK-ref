import Room, { Setting, Place } from '../models/room';
import { firestore } from '../app';
import { IUser } from '../models/user';

const collection = `rooms`;

async function insert(room: Room) {
  const ref = firestore.collection(collection);
  const info = room.info();
  const doc = await ref.doc(room.code).set(info);
  const result = {
    code: room.code,
    room: (await ref.doc(room.code).get()).data(),
  };
  return result;
  // return doc.writeTime.toDate().getMinutes() === new Date().getMinutes();
}
async function find(code: string) {
  const ref = firestore.collection(collection);
  const doc = await ref.doc(code).get();
  if (!doc.exists) {
    return null; //방 없음
  }
  const data = await doc.data();
  const room = new Room(data.master, code, data.users, data.setting);
  return room;
}

async function update(
  code: string,
  setting?: Setting,
  users?: IUser[],
  master?: IUser
) {
  try {
    const ref = firestore.collection(collection);
    const obj: any = {}; //timestamp: new Date()
    if (setting) {
      obj.setting = setting.get();
    }
    if (users) {
      obj.users = users;
    }
    if (master) {
      obj.master = master;
      obj.users = users;
    }
    const doc = await ref.doc(code).update(obj);
    console.log((await ref.doc(code).get()).data());
    return !!doc.writeTime.toDate() ? (await ref.doc(code).get()).data() : null;
  } catch (e) {
    console.log(e);
    return e;
  }
}

async function deleteRoom(code: string) {
  const ref = firestore.collection(collection);
  const doc = await ref.doc(code).delete();
  return !!doc.writeTime;
}

export { insert, find, update, deleteRoom };
