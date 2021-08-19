import { ICabinet } from './cabinet';
import { ITreasure } from './treasure';
import { IGameUser } from './gameUser';
export interface IGame {
  cabinets: ICabinet;
  treasures: ITreasure;
  user: IGameUser;
}
