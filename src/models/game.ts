import { ICabinet } from './cabinet';
import { ITreasures } from './treasure';
import { IGameUser } from './gameUser';
export interface IGame {
  cabinet: ICabinet;
  treasures: ITreasures;
  users: IGameUser;
}
