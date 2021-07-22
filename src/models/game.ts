import { ICabinet } from './cabinet';
import { ITreasure } from './treasure';
import { IGameUser } from './gameUser';
export interface IGame {
  cabinet: ICabinet;
  treasures: ITreasure;
  users: IGameUser;
}
