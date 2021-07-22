import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import * as GameDao from '../dao/game';
import * as UserDao from '../dao/user';
import { ITreasure } from '../models/treasure';
import { ICabinet } from '../models/cabinet';
import { IGameUser, Role } from '../models/gameUser';
import { IGame } from '../models/game';

/**
 * 도둑 - [1]보물 수집, [2]금고에 보물 보관,
 * 보안관 - [3]금고 발견(+금고 안 보물 재배치), [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치),
 * 배신자 - [5]금고 위치 보안관에게 알리기(오프라인으로 알리기)
 */

const MAX_TREASURE_NUM = 30;
const MAX_CABINET_NUM = 5;

function getRandomNum(length: number) {
  const num = Math.floor(Math.random() * length);
  return num;
}
function getCabinetArray(preId?: string): ICabinet {
  const cabinets: ICabinet = {};
  let maxNum = MAX_CABINET_NUM;
  for (let i = 0; i < maxNum; i++) {
    cabinets[i] = {
      state: false,
      treasureCount: 0,
    };
  }
  for (let i = 0; i < 1; i++) {
    if (preId && preId === getRandomNum(maxNum).toString()) {
      i--;
      continue;
    }
    cabinets[getRandomNum(maxNum)].state = true;
  }

  return cabinets;
}
function getTreasureArray(
  length: number,
  maxLength: number,
  treasuresArg: ITreasure
): ITreasure {
  const treasures = treasuresArg;
  let maxNum = maxLength; //50?
  for (let i = 0; i < length; i++) {
    const randomNum = Math.floor(Math.random() * maxNum);
    if (treasures[randomNum].state === true) {
      i--;
      continue;
    }
    treasures[randomNum].state = true;
  }
  return treasures;
}

const codeSchema = yup.string().required();
const userSchema = yup.string().required();
// 게임 시작
async function startGameMaster(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const nickname = userSchema.validateSync(req.query.nickname);
    const room = await RoomDao.find(code);
    if (!room) {
      logger.info(`POST /game | can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `can't find room code : ${code}` });
    }
    if (room.master.nickname !== nickname) {
      logger.info(`POST /game | ${nickname} is not master.`);
      return res
        .status(200)
        .json({ success: false, msg: `You are not master.` }); //준비
    } else {
      //방장이 시작
      //게임 초기화
      // 1. 보물 위치
      let treasureArr: ITreasure = {};
      for (let i = 0; i < MAX_TREASURE_NUM; i++) {
        //보물 초기화
        treasureArr[i] = {
          state: false,
        };
      }
      treasureArr = getTreasureArray(
        Math.floor(room.setting.goal * 1.5),
        MAX_TREASURE_NUM,
        treasureArr
      );
      // 2. 캐비넷 위치
      const cabinet: ICabinet = getCabinetArray();
      // 3. 역할 정하기
      const users: IGameUser = {};
      const policeIndex = getRandomNum(room.users.length);
      for (let i = 0; i < room.users.length; i++) {
        users[room.users[i].nickname] = {
          role: Role.THIEF,
          treasureCount: 0,
        };
        if (i === policeIndex) {
          users[room.users[i].nickname].role = Role.POLICE;
        }
      }
      // 게임 초기화 끝
      const game: IGame = {
        cabinet: cabinet,
        treasures: treasureArr,
        users: users,
      };
      const isInsert = await GameDao.setGame(code, game);
      if (!isInsert) {
        logger.info(
          `POST /game | Failed to initialize game room code : ${code}`
        );
        return res
          .status(400)
          .json({ success: false, msg: `게임 초기화를 실패하였습니다.` });
      } else {
        for (let user of room.users) {
          user.isReady = true; //상태가 변했을 때 실시간으로 get요청이 보내지는지 확인해보기
        }
        room.master.isReady = true;
        RoomDao.update(code, null, room.users, room.master);
        const startGame = await GameDao.findGame(code);
        if (!startGame) {
          logger.info(`POST /game | Failed to bring up the game!`);
          return res
            .status(400)
            .json({ success: false, msg: 'Failed to bring up the game!' });
        }
        logger.info(
          `POST /game | Success to initialize game room code: ${code} - ENJOY!`
        );
        const info = startGame.users[room.master.nickname];
        return res.status(201).json({ game: startGame, info: info });
      }
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
async function startGameUser(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const nickname = userSchema.validateSync(req.query.nickname);
    const startGame = await GameDao.findGame(code);
    if (!startGame) {
      logger.info(`GET /game | Failed to bring up the game code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: 'Failed to bring up the game!' });
    } else {
      logger.info(
        `GET /game | Success to bring up the game! room code : ${code} - ENJOY!`
      );
      const info = startGame.users[nickname];
      if (!info) {
        logger.info(`GET /game | You are not entered this room code: ${code}`);
        return res
          .status(400)
          .json({ success: false, msg: 'Failed to bring up the game!' });
      }
      return res.status(200).json({ game: startGame, info: info });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// 보물 상태 확인
async function stateOfTreasure(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const code: string = codeSchema.validateSync(req.query.code);
    const state = await GameDao.findTreasureInfo(code, id);
    return res.status(200).json({ state: state });
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// 도둑 - 보물 수집
async function findTreasure(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const code: string = codeSchema.validateSync(req.query.code);
    const nickname = userSchema.validateSync(req.query.nickname);
    const state = await GameDao.updateTreasureInfo(code, id, false);
    if (state) {
      const user = await GameDao.findGameUser(code, nickname);
      user.treasureCount += 1;
      const isUpdated = await GameDao.updateGameUser(
        code,
        nickname,
        user.role,
        user.treasureCount
      );
      return res.status(200).json({ state: !state });
    }
    return res.status(200).json({ state: true });
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// 도둑 - 금고에 보물 보관
async function keepTreasureInCabinet(req: Request, res: Response) {
  try {
    const id = req.params.id; // 캐비넷 번호
    const code: string = codeSchema.validateSync(req.query.code);
    const nickname = userSchema.validateSync(req.query.nickname);
    const user = await GameDao.findGameUser(code, nickname);
    const cabinet = await GameDao.findCabinetInfos(code);
    if (cabinet[id].state) {
      // 열린 금고일 때만
      const isUpdatedCabinet = await GameDao.updateCabinetInfo(
        code,
        id,
        true,
        cabinet[id].treasureCount + user.treasureCount
      );
      const isUpdatedUser = await GameDao.updateGameUser(
        code,
        nickname,
        Role.THIEF,
        0
      );
      return isUpdatedCabinet && isUpdatedUser //반환값 상의
        ? res.status(200).json({ state: true })
        : res.status(400).json({ state: false });
    } else {
      return res.status(400).json({ state: false });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// [3]보안관 - 금고 발견(+금고 안 보물 재배치)
async function findCabinet(req: Request, res: Response) {
  try {
    const id = req.params.id; // 캐비넷 번호
    const code: string = codeSchema.validateSync(req.query.code);
    const nickname = userSchema.validateSync(req.query.nickname);
    const cabinets = await GameDao.findCabinetInfos(code);
    const treasures = await GameDao.findTreasureInfos(code);
    // 도둑들이 중간에 변경하지 못하게 해야할듯
    if (cabinets[id].state) {
      // 금고 재배치 & 금고 안 보물 수만큼 보물 배치
      const newCabinets = getCabinetArray(id);
      const newTreasures = getTreasureArray(
        cabinets[id].treasureCount,
        Object.keys(treasures).length,
        treasures
      );
      const isUpdatedCabinets = await GameDao.updateCabinetInfos(
        code,
        newCabinets
      );
      const isUpdatedTreasures = await GameDao.updateTreasureInfos(
        code,
        newTreasures
      );
      if (isUpdatedCabinets && isUpdatedTreasures) {
        return res.status(200).json({ success: true });
      }
    } else {
      return res.status(200).json({ success: false });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치)
async function catchRobber(req: Request, res: Response) {
  try {
    // AI 서버에서 유저 확인 - photoPath 가져오기
    const code: string = codeSchema.validateSync(req.query.code);
    const photoPath = userSchema.validateSync(req.query.nickname);
    const user = await UserDao.findByPhotoPath(photoPath);
    if (!user) {
      return res.status(200).json({ success: false });
    } else {
      const gameUser = await GameDao.findGameUser(code, user.nickname);
      if (!gameUser) {
        return res.status(200).json({ success: false });
      } else {
        const treasures = await GameDao.findTreasureInfos(code);
        const newTreasures = getTreasureArray(
          gameUser.treasureCount,
          Object.keys(treasures).length,
          treasures
        );
        const isUpdatedTreasures = await GameDao.updateTreasureInfos(
          code,
          newTreasures
        );
        const isUpdatedUser = await GameDao.updateGameUser(
          code,
          user.nickname,
          Role.TRAITOR,
          0
        );

        return res
          .status(200)
          .json({ success: isUpdatedUser && isUpdatedTreasures });
      }
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}

// 게임 끝
function endGame(req: Request, res: Response) {
  try {
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const router = express.Router();

router.post('/', startGameMaster); //게임 시작
router.get('/', startGameUser);
router.get('/treasure/:id', stateOfTreasure);
router.put('/treasure/:id', findTreasure);
router.put('/cabinet/:id', keepTreasureInCabinet);
router.post('/cabinet/:id', findCabinet);
router.post('/robber', catchRobber);
router.get('/', endGame); // 게임 종료 - TODO

export { router as gameRouter };
