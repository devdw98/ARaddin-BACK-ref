import { Cabinet, ICabinets } from '../models/cabinet';
import { firestore } from '../app';
import { ITreasures } from '../models/treasure';
import { GameUser, User } from '../models/user';

const upperCollection = `rooms`;

const cabinet_id = 'cabinetInfo';
const treasure_id = 'treasuresInfo';
const users_id = 'usersInfo';

export async function setCabinet(code: string, id: number, cabinet: Cabinet){
  const ref = firestore.collection(upperCollection).doc(code).collection(cabinet_id).doc(`index_${id}`);
  const  result = await ref.set(cabinet.get());
  return !!result.writeTime;
}
export async function getCabinet(code: string, id: string){
  const ref = firestore.collection(upperCollection).doc(code).collection(cabinet_id).doc(id);
  const result = (await ref.get()).data();
  return new Cabinet(result['state'], result['treasureCount']);
}
export async function setCabinets(code: string, cabinets: ICabinets) {
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
export async function findCabinetInfos(code: string) {
  let cabinets: ICabinets = {};
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
export async function updateCabinetInfo(
  code: string,
  id: string,
  cabinet: Cabinet
) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(cabinet_id).doc(id);
  const doc = await ref
    .update(cabinet.get());
  return !!doc;
}

export async function setTreasures(code: string, treasures: ITreasures) {
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
  let treasures: ITreasures = {};
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

export async function findGameUser(code: string, nickname: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(users_id).doc(nickname);
  const data = await (await ref.get()).data();
  const user = new GameUser(new User(data['email'], nickname), {role: data['role'], treasureCount: data['treasureCount']});
  return user;
}

export async function updateGameUser(code: string, user: GameUser) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(users_id);
  const doc = await ref.doc(user.nickname).update(user.getInfos());
  return !!doc;
}

export async function findGameUsers(code: string){
  const ref = firestore.collection(upperCollection).doc(code).collection(users_id);
  
}