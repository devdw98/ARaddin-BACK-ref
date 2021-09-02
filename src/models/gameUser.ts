export enum Role {
  THIEF, //도둑
  TRAITOR, //배신자 (도둑 아웃)
  POLICE, //경찰
  NOT = 10,
}
export interface IGameUser {
  [username: string]: {
    role?: Role;
    treasureCount: number; // 유저가 보물 찾을 때마다 +1
  };
}
