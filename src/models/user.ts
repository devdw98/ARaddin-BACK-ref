export interface IUser {
  email: string;
  nickname: string;
  photoPath?: string;
}

export interface IRoomUser extends IUser {
  isReady: boolean;
}
