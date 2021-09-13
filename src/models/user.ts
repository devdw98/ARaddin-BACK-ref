export enum Role {
  THIEF, //도둑
  TRAITOR, //배신자 (도둑 아웃)
  POLICE, //경찰
  NOT = 10,
}

export interface IUser {
  email: string;
  nickname: string;
}

export interface IMaster extends IUser {
  isReady: boolean;
}

export interface IUserGameInfo {
  role: Role;
  treasureCount: number;
}

export class User {
  email: string;
  nickname: string;
  constructor(email: string, nickname: string) {
    this.email = email;
    this.nickname = nickname;
  }
  get() {
    const user: IUser = {
      email: this.email,
      nickname: this.nickname,
    };
    return user;
  }
}

export class Master extends User {
  isReady: boolean;
  constructor(user: User, isReady: boolean) {
    super(user.email, user.nickname);
    this.isReady = isReady;
  }
  getMaster() {
    const master: IMaster = {
      email: this.email,
      nickname: this.nickname,
      isReady: this.isReady,
    };
    return master;
  }
}

export class GameUser extends User {
  role: Role;
  treasureCount: number;
  constructor(user: User, info?: IUserGameInfo) {
    super(user.email, user.nickname);
    this.role = info ? info.role : Role.NOT;
    this.treasureCount = info ? info.treasureCount : -1;
  }
  getInfos() {
    const result = {
      email: this.email,
      role: this.role,
      treasureCount: this.treasureCount,
    };
    return result;
  }
  getGameInfo(){
    const result:IUserGameInfo = {
      role: this.role,
      treasureCount: this.treasureCount
    }
    return result;
  }
  addTreasureCount(count: number){
    this.treasureCount += count;
  }
  set(role:Role, treasureCount?: number){
    this.role = role;
      if(role === Role.TRAITOR){
        this.treasureCount = 0;
      }
  }
}
