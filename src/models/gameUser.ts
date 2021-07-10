export enum Role {
  THIEF, //도둑
  TRAITOR, //배신자 (도둑 아웃)
  POLICE, //경찰
}
export interface IGameUser {
  [username: string]: {
    role?: Role;
    havingTreasures?: number[];
  };
}
