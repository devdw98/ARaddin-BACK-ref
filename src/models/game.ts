import { ICabinet } from './cabinet';
import { ITreasure } from './treasure';
import { IGameUser } from './gameUser';
// export interface IGame {
//   cabinets: ICabinet;
//   treasures: ITreasure;
//   user: IGameUser;
// }
import { Role } from './gameUser';
export interface IGame {
  finish: boolean;
  winTeam: Role;
}
