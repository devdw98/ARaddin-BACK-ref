export interface ICabinets {
  [cabinetId: string]: {
    // 금고 번호
    state: boolean; //금고 상태
    treasureCount: number; //금고에 저장된 보물 개수
  };
}

//금고 위치 후보는 5개

export class Cabinet {
  state: boolean;
  treasureCount: number;
  constructor(state: boolean, treasureCount: number) {
    this.state = state;
    this.treasureCount = treasureCount;
  }
  get() {
    const cabinet: ICabinet = {
      state: this.state,
      treasureCount: this.treasureCount,
    };
    return cabinet;
  }
  addTreasureCount(count: number) {
    this.treasureCount += count;
  }
  setState(state: boolean) {
    this.state = state;
  }
  init() {
    this.state = false;
    this.treasureCount = 0;
  }
}

export interface ICabinet {
  state: boolean;
  treasureCount: number;
}
