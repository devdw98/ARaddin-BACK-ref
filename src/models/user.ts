class User implements IUser {
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
      //   photoPath: this.photoPath,
    };
    return user;
  }
}

export interface IUser {
  email: string;
  nickname: string;
}

export default User;
