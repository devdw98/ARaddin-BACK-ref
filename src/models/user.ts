export interface IUser {
  email: string;
  nickname: string;
  photoPath?: string;
}

export interface IMaster extends IUser {
  isReady: boolean;
}

export class User {
  email: string;
  nickname: string;
  photoPath: string;
  constructor(email: string, nickname: string) {
    this.email = email;
    this.nickname = nickname;
    this.photoPath = email.split('@')[0];
  }
  get() {
    const user: IUser = {
      email: this.email,
      nickname: this.nickname,
      photoPath: this.photoPath,
    };
    return user;
  }
}
