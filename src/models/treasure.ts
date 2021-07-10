export interface ITreasures {
  foundCount: number; // 찾은 보물 총 개수
  treasures: ITreasure[]; //보물 정보
}
export interface ITreasure {
  readonly _id: number;
  position: string; //위치
  foundUser: string; //찾은 사람
}
