export interface IUser {
  email: string;
  nickname: string;
}

export interface IMaster extends IUser {
  isReady: boolean;
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
