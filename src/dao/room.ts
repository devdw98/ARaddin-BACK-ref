import { Setting } from '../models/room';
import { firestore } from '../app';
import { IUser, Master, User, GameUser } from '../models/user';
import { IGame } from '../models/game';
import logger from '../utils/logger';

const collection = `rooms`;
const room_id = `roomInfo`;
const users_id = `usersInfo`;
const master_id = `master`;
const setting_id = `setting`;
const game_id = `game`;

export function setSetting(code: string, setting: Setting): Setting {
  try {
    const ref = firestore
      .collection(collection)
      .doc(code)
      .collection(room_id)
      .doc(setting_id);
    ref.set(setting.get());

    return setting;
  } catch (e) {
    logger.error(e.message);
  }
}

export async function getSetting(code: string): Promise<Setting> {
  const ref = firestore
    .collection(collection)
    .doc(code)
    .collection(room_id)
    .doc(setting_id)
    .get();
  if ((await ref).exists) {
    const setting_data = (await ref).data();
    const setting = new Setting(
      setting_data.goal,
      setting_data.timeLimit,
      setting_data.place
    );
    return setting;
  }
  return null;
}

export async function deleteSetting(code: string) {
  const ref = firestore.collection(collection).doc(code).collection(room_id);
  ref.doc(setting_id).delete();
  ref.doc(master_id).delete();
}

// store user info
export async function setUser(code: string, user: User): Promise<GameUser> {
  const gameUser = new GameUser(user);
  try {
    const ref = firestore.collection(collection).doc(code).collection(users_id);
    ref.doc(gameUser.nickname).set(gameUser.getInfos());
    return gameUser;
  } catch (e) {
    logger.error(e.message);
  }
}
export async function deleteUser(code: string, user: User) {
  try {
    const ref = firestore.collection(collection).doc(code).collection(users_id);
    ref.doc(user.nickname).delete();
  } catch (e) {
    logger.error(e.message);
  }
}

// user all list
export async function setUsers(
  code: string,
  users: Array<IUser>
): Promise<IUser[]> {
  try {
    const ref = firestore.collection(collection).doc(code);
    const result: Array<IUser> = await ref
      .set({ users: users })
      .then(async () => {
        return (await ref.get()).data()['users'];
      });
    return result;
  } catch (e) {
    logger.error(e.message);
  }
}
export async function getUsers(code: string): Promise<IUser[]> {
  try {
    const ref = firestore.collection(collection).doc(code);
    const users: Array<IUser> = (await ref.get()).data()['users'];
    return users;
  } catch (e) {
    logger.error(e.message);
  }
}
export async function setMaster(code: string, master: Master): Promise<Master> {
  const ref = firestore
    .collection(collection)
    .doc(code)
    .collection(room_id)
    .doc(master_id);
  ref.set(master.getMaster());
  return master;
}
export async function getMaster(code: string): Promise<Master> {
  const ref = firestore
    .collection(collection)
    .doc(code)
    .collection(room_id)
    .doc(master_id);
  const data = (await ref.get()).data();
  const master = new Master(new User(data.email, data.nickname), data.isReady);
  return master;
}

export async function deleteRoom(code: string) {
  try {
    const ref = firestore.collection(collection).doc(code);
    ref.collection(room_id).doc(setting_id).delete(); // settings
    ref.collection(room_id).doc(master_id).delete(); // master
    const doc = await ref.delete();
    return !!doc.writeTime;
  } catch (e) {
    logger.error(e);
  }
}

export async function setGame(code: string, gameInfo: IGame) {
  try {
    const ref = firestore
      .collection(collection)
      .doc(code)
      .collection(room_id)
      .doc(game_id);
    ref.set(gameInfo);
  } catch (e) {
    logger.error(e.message);
  }
}

export async function getGame(code: string) {
  try {
    const ref = firestore
      .collection(collection)
      .doc(code)
      .collection(room_id)
      .doc(game_id)
      .get();
    const data = (await ref).data();
    return data.winTeam;
  } catch (e) {
    logger.error(e.message);
  }
}
