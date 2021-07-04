import { IUser } from './user';

function getRandomCode() {
  const code =
    Math.random().toString(36).substring(7, 10) +
    Math.random().toString(36).substring(2, 5);
  return code;
}

export default class Room {
  code: string;
  master: IUser;
  users: Array<IUser>;
  setting: Setting;
  constructor(
    master: IUser,
    code: string = getRandomCode(),
    users: Array<IUser> = [master],
    setting: Setting = new Setting()
  ) {
    this.code = code;
    this.master = master;
    this.users = users;
    this.setting = setting;
  }
  info() {
    const room = {
      master: this.master,
      users: this.users,
      setting: this.setting.get(),
    };
    return room;
  }
}

export class Setting {
  goal: number;
  timeLimit: number;
  place: Place;
  constructor(
    goal: number = 10,
    timeLimit: number = 10,
    place: Place = Place.UP
  ) {
    this.goal = goal;
    this.timeLimit = timeLimit;
    this.place = place;
  }
  get() {
    const setting = {
      goal: this.goal,
      timeLimit: this.timeLimit,
      place: this.place,
    };
    return setting;
  }
}

export enum Place {
  UP,
  DOWN,
}
