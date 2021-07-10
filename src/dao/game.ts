import { firestore } from '../app';
import { IGame } from '../models/game';

const upperCollection = `rooms`;
const subCollection = `game`;

const cabinet_id = 'cabinetInfo';
const treasure_id = 'treasuresInfo';
const users_id = 'usersInfo';

export async function insert(code: string, game: IGame) {
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

export async function find(code: string) {
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
      cabinet: {
        position: cabinet_doc.position,
        stores: cabinet_doc.stores,
      },
      treasures: {
        foundCount: treasure_doc.foundCount,
        treasures: treasure_doc.treasures,
      },
      users: users_doc,
    };
    return game;
  }
}
