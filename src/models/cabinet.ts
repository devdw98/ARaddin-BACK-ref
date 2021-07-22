export interface ICabinet {
  [cabinetId: string]: {
    // 금고 번호
    state: boolean; //금고 상태
    treasureCount: number; //금고에 저장된 보물 개수
  };
}

//금고 위치 후보는 5개
