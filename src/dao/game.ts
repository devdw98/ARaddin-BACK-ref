import { ICabinet } from '../models/cabinet';
import { firestore } from '../app';
import { IGame } from '../models/game';
import { Role } from '../models/gameUser';
import { ITreasure } from '../models/treasure';

const upperCollection = `rooms`;
const subCollection = `game`;

const cabinet_id = 'cabinetInfo';
const treasure_id = 'treasuresInfo';
const users_id = 'usersInfo';

export async function setGame(code: string, game: IGame) {
  //초기화 코드
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const cabinet_doc = await ref.doc(cabinet_id).set(game.cabinet);
  const treasure_doc = await ref.doc(treasure_id).set(game.treasures);
  const users_doc = await ref.doc(users_id).set(game.users);
  return cabinet_doc && treasure_doc && users_doc ? true : false;
}

export async function findGame(code: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);

  const cabinet_doc = await (await ref.doc(cabinet_id).get()).data();
  const treasure_doc = await (await ref.doc(treasure_id).get()).data();
  const users_doc = await (await ref.doc(users_id).get()).data();
  if (!cabinet_doc || !treasure_doc || !users_doc) {
    return null;
  } else {
    const game: IGame = {
      cabinet: cabinet_doc,
      treasures: treasure_doc,
      users: users_doc,
    };
    return game;
  }
}

export async function findTreasureInfo(code: string, id: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const treasure_doc = (await ref.doc(treasure_id).get()).data();
  return !treasure_doc ? null : treasure_doc[id].state;
}
export async function findTreasureInfos(code: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const treasure_doc = (await ref.doc(treasure_id).get()).data();
  return !treasure_doc ? null : treasure_doc;
}

export async function updateTreasureInfo(
  code: string,
  id: string,
  state: boolean
) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const doc = await ref.doc(treasure_id).update({ [id]: { state: state } });
  return !!doc;
}
export async function updateTreasureInfos(code: string, treasures: ITreasure) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const doc = await ref.doc(treasure_id).update(treasures);
  return !!doc;
}
export async function findGameUser(code: string, nickname: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const users_doc = await (await ref.doc(users_id).get()).data();
  return !users_doc || !users_doc[nickname] ? null : users_doc[nickname];
}

export async function updateGameUser(
  code: string,
  nickname: string,
  role: Role,
  count: number
) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const doc = await ref
    .doc(users_id)
    .update({ [nickname]: { role: role, treasureCount: count } });
  return !!doc;
}

export async function findCabinetInfos(code: string) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
  const cabinet_doc = (await ref.doc(cabinet_id).get()).data();
  return !cabinet_doc ? null : cabinet_doc;
}
export async function updateCabinetInfos(code: string, cabinets: ICabinet) {
  const ref = firestore
    .collection(upperCollection)
    .doc(code)
    .collection(subCollection);
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
    .collection(subCollection);
  const doc = await ref
    .doc(cabinet_id)
    .update({ [id]: { state: state, treasureCount: treasureCount } });
  return !!doc;
}
