import { IUser } from './user';

export interface IRoom {
  code: string;
  master: IUser;
  users: Array<IUser>;
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
