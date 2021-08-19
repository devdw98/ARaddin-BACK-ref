import { IMaster, IUser } from './user';

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

export class Setting {
  goal: number;
  timeLimit: number;
  place: Place;
  constructor(goal: number = 10, time: number = 10, place: Place = Place.UP) {
    this.goal = goal;
    this.timeLimit = time;
    this.place = place;
  }
  get() {
    const setting: ISetting = {
      goal: this.goal,
      timeLimit: this.timeLimit,
      place: this.place,
    };
    return setting;
  }
}

export class Room {
  code: string;
  master: IMaster;
  users: Array<IUser>;
  setting: Setting;
  constructor(
    code: string,
    master: IMaster,
    users: Array<IUser>,
    setting: Setting = new Setting()
  ) {
    this.code = code;
    this.master = {
      email: master.email,
      nickname: master.nickname,
      isReady: master.isReady,
    };
    this.users = users;
    this.setting = setting;
  }
  get() {
    const room: IRoom = {
      code: this.code,
      master: this.master,
      users: this.users,
      setting: this.setting.get(),
    };
    return room;
  }
}
