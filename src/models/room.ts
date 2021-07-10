import { IRoomUser } from './user';

export interface IRoom {
  code: string;
  master: IRoomUser;
  users: Array<IRoomUser>;
  setting: ISetting;
}

export interface ISetting {
  goal: number;
  timeLimit: number;
  place: Place;
}

export enum Place {
  UP,
  DOWN,
}
