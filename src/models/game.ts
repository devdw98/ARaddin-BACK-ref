import { Role } from './user';
export interface IGame {
  finish: boolean;
  winTeam: Role;
}

export class Game {
  finish: boolean;
  winTeam: Role;
  constructor(finish: boolean = false, winTeam: Role = Role.NOT) {
    this.finish = finish;
    this.winTeam = winTeam;
  }
  get() {
    const game: IGame = {
      finish: this.finish,
      winTeam: this.winTeam,
    };
    return game;
  }
}
