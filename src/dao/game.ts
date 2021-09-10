import { ICabinet } from '../models/cabinet';
import { firestore } from '../app';
import { IGameUser, Role } from '../models/gameUser';
import { ITreasure } from '../models/treasure';
import { GameUser } from '../models/user';

const upperCollection = `rooms`;
const subCollection = `game`;

const cabinet_id = 'cabinetInfo';
const treasure_id = 'treasuresInfo';
const users_id = 'usersInfo';

export async function setCabinets(code: string, cabinets: ICabinet) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(cabinet_id);
  let count = 0;
  for (const [key, value] of Object.entries(cabinets)) {
    count = ref.doc(key).set(value) ? count + 1 : count;
  }
  return count != 0;
}
export async function setTreasures(code: string, treasures: ITreasure) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(treasure_id);
  let count = 0;
  for (const [key, value] of Object.entries(treasures)) {
    count = ref.doc(key).set(value) ? count + 1 : count;
  }
  return count != 0;
}
export async function setGameUsers(code: string, users: IGameUser) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(users_id);
  let count = 0;
  for (const [key, value] of Object.entries(users)) {
    count = ref.doc(key).set(value) ? count + 1 : count;
  }
  return count != 0;
}

export async function findTreasureInfo(code: string, id: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(treasure_id)
    .doc(id);
  const treasure_doc = (await ref.get()).data();
  return !treasure_doc ? null : treasure_doc['state'];
}
export async function findTreasureInfos(code: string) {
  let treasures: ITreasure = {};
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(treasure_id);
  const docs = await ref.listDocuments();
  for (const doc of docs) {
    const data = (await doc.get()).data();
    treasures[doc.id] = {
      state: data['state'],
    };
  }
  return treasures;
}

export async function updateTreasureInfo(
  code: string,
  id: string,
  state: boolean
) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(treasure_id)
    .doc(id);
  const doc = await ref.update({ state: state });
  return !!doc;
}
export async function updateTreasureInfos(code: string, treasures: ITreasure) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(treasure_id);
  const doc = await ref.doc(treasure_id).update(treasures);
  return !!doc;
}
export async function findGameUser(code: string, nickname: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(users_id);
  const user_data = await (await ref.doc(nickname).get()).data();
  const user: IGameUser = {
    [nickname]: {
      role: user_data['role'],
      treasureCount: user_data['treasureCount'],
    },
  };
  return user[nickname];
}

export async function updateGameUser(code: string, user: GameUser) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(users_id);
  const doc = await ref.doc(user.nickname).update(user.getInfos());
  return !!doc;
}

export async function findCabinetInfos(code: string) {
  let cabinets: ICabinet = {};
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(cabinet_id);
  const docs = await ref.listDocuments();
  for (const doc of docs) {
    const data = (await doc.get()).data();
    cabinets[doc.id] = {
      state: data['state'],
      treasureCount: data['treasureCount'],
    };
  }
  return cabinets;
}
export async function updateCabinetInfos(code: string, cabinets: ICabinet) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(cabinet_id);
  const doc = await ref.doc(cabinet_id).update(cabinets);
  return !!doc;
}
export async function updateCabinetInfo(
  code: string,
  id: string,
  state: boolean,
  treasureCount: number
) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(cabinet_id);
  const doc = await ref
    .doc(id)
    .update({ state: state, treasureCount: treasureCount });
  return !!doc;
}
