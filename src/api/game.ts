import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import * as GameDao from '../dao/game';
import { ITreasure } from '../models/treasure';
import { ICabinet } from '../models/cabinet';
import { IGameUser, Role } from '../models/gameUser';
import { isUserAIServer, learningPhotosAIServer } from '../utils/axiosUtils';
import { uploadRoom, uploadPhotos } from '../utils/multerUtils';
import { rootPhotoPath, userPhotoPath, roomPhotoPath } from '../vars';
import * as Service from '../utils/service';
import { GameUser, Master } from '../models/user';
import { User } from '../models/user';
import { IGame } from '../models/game';

/**
 * 도둑 - [1]보물 수집, [2]금고에 보물 보관,
 * 보안관 - [3]금고 발견(+금고 안 보물 재배치), [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치),
 * 배신자 - [5]금고 위치 보안관에게 알리기(오프라인으로 알리기)
 */

const codeSchema = yup.string().required();
const userSchema = yup.string().required();
const tokenScheme = yup.string().required();

// 게임 시작 - 시간 기능 추가하기
async function startGameMaster(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /game | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const room = await Service.getRoom(code);
    if (!room) {
      logger.info(`POST /game | can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `can't find room code : ${code}` });
    }
    if (room.master.nickname !== user.nickname) {
      logger.info(`POST /game | ${user.nickname} is not master.`);
      return res
        .status(200)
        .json({ success: false, msg: `You are not master.` }); //준비
    } else {
      //방장이 시작
      // 유저들 사진 ai-server에 학습
      for (let user of room.users) {
        const aiServerResponse = await learningPhotosAIServer(
          code

        );
        if (aiServerResponse == 201) {
          continue;
        } else {
          return res.status(400).json({
            success: false,
            msg: `AI server can't prepare model ${user.email}`,
          });
        }
      }
      //게임 초기화
      // 0. game 정보 초기화
      const gameInfo: IGame = {
        finish: false,
        winTeam: Role.NOT,
      };
      RoomDao.setGame(code, gameInfo);
      // 1. 보물 위치
      let treasureArr: ITreasure = {};
      for (let i = 0; i < Service.MAX_TREASURE_NUM; i++) {
        //보물 초기화
        treasureArr[Service.INDEX + i] = {
          state: false,
        };
      }
      treasureArr = Service.getTreasureArray(
        Math.floor(room.setting.goal * 1.5),
        Service.MAX_TREASURE_NUM,
        treasureArr
      );
      // GameDao.setTreasures(code, treasureArr);
      // 2. 캐비넷 위치
      const cabinets: ICabinet = Service.getCabinetArray();
      // GameDao.setCabinets(code, cabinets);
      // // 3. 역할 정하기
      // const users: IGameUser = {};
      const policeIndex = Service.getRandomNum(room.users.length);
      for (let i = 0; i < room.users.length; i++) {
        const user = new GameUser(
          new User(room.users[i].email, room.users[i].nickname),
          {
            role: Role.THIEF,
            treasureCount: 0,
          }
        );
        if (i === policeIndex) {
          user.role = Role.POLICE;
        }
        GameDao.updateGameUser(code, user);
      }
      // GameDao.setGameUsers(code, users);
      // 게임 초기화 끝
      if (
        GameDao.setTreasures(code, treasureArr) &&
        GameDao.setCabinets(code, cabinets)
        // GameDao.setGameUsers(code, users)
      ) {
        const result = await RoomDao.setMaster(
          code,
          new Master(new User(room.master.email, room.master.nickname), true)
        );
        logger.info(
          `POST /game | Success to initialize game room code: ${code} - ENJOY!`
        );
        return res.status(201).json({ success: result.isReady });
      } else {
        logger.info(
          `POST /game | Failed to initialize game room code : ${code}`
        );
        return res
          .status(400)
          .json({ success: false, msg: `게임 초기화를 실패하였습니다.` });
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
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /game | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const cabinets = await GameDao.findCabinetInfos(code);
    const treasures = await GameDao.findTreasureInfos(code);
    const info = await GameDao.findGameUser(code, user.nickname);
    logger.info(
      `GET /game | Success to bring up the game! room code : ${code} - ENJOY!`
    );

    if (!info) {
      logger.info(`GET /game | You are not entered this room code: ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: 'Failed to bring up the game!' });
    }
    return res.status(200).json({
      cabinets: cabinets,
      treasures: treasures,
      info: info,
    });
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
// TODO 경찰이 보물 수집 못하게 하기
async function findTreasure(req: Request, res: Response) {
  try {
    const id = req.params.id;
    const code: string = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /game | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const state = await GameDao.findTreasureInfo(code, id);
    if (state) {
      const isUpdated = await GameDao.updateTreasureInfo(code, id, false);
      if (isUpdated) {
        const gameUser = await GameDao.findGameUser(code, user.nickname);
        gameUser.treasureCount += 1;
        const isUpdatedUser = await GameDao.updateGameUser(
          code,
          new GameUser(user, {
            role: gameUser.role,
            treasureCount: gameUser.treasureCount,
          })
        );
        return res.status(200).json({ state: !state });
      }
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
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /game | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const gameUser = await GameDao.findGameUser(code, user.nickname);
    const cabinets = await GameDao.findCabinetInfos(code);
    const setting = await RoomDao.getSetting(code);
    if (cabinets[id].state) {
      // 열린 금고일 때만
      const count = cabinets[id].treasureCount + gameUser.treasureCount;
      const isUpdatedCabinet = await GameDao.updateCabinetInfo(
        code,
        id,
        true,
        count
      );
      const isUpdatedUser = await GameDao.updateGameUser(
        code,
        new GameUser(user, { role: gameUser.role, treasureCount: 0 })
      );
      if (count >= setting.goal) {
        // 게임 종료 조건 1 - 목표치 다 채움
        const gameInfo: IGame = {
          finish: true,
          winTeam: Role.THIEF,
        };
        RoomDao.setGame(code, gameInfo);
      }
      return isUpdatedCabinet && isUpdatedUser //반환값 상의
        ? res.status(200).json({ state: true })
        : res.status(400).json({ state: false });
    } else {
      return res.status(200).json({ state: false }); // 열린 금고 아님
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
    const cabinets = await GameDao.findCabinetInfos(code);
    const treasures = await GameDao.findTreasureInfos(code);

    // 도둑들이 중간에 변경하지 못하게 해야할듯
    if (cabinets[id].state) {
      // 금고 재배치 & 금고 안 보물 수만큼 보물 배치
      const newCabinets = Service.getCabinetArray(id);
      const newTreasures = Service.getTreasureArray(
        cabinets[id].treasureCount,
        Object.keys(treasures).length,
        treasures
      );
      const isUpdatedCabinets = await GameDao.setCabinets(code, newCabinets);
      const isUpdatedTreasures = await GameDao.setTreasures(code, newTreasures);
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
async function findTreasureCount(req: Request, res: Response) {
  try {
    const code: string = codeSchema.validateSync(req.query.code);
    const cabinets = await GameDao.findCabinetInfos(code);
    let treasureCount = 0;
    for (const cabinet of Object.keys(cabinets)) {
      if (cabinets[cabinet].state) {
        treasureCount = cabinets[cabinet].treasureCount;
        break;
      }
    }
    logger.info(
      `GET /cabinet | code = ${code}, treasureCount = ${treasureCount}`
    );
    return res.status(200).json({ treasureCount: treasureCount });
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치)
async function catchRobber(req: Request, res: Response) {
  try {
    // AI 서버에서 유저 확인 - photoPath - code
    const code: string = codeSchema.validateSync(req.query.code);
    const files = req.files as Express.Multer.File[];
    const isUpload = uploadPhotos(rootPhotoPath + roomPhotoPath, code, files);
    if (!isUpload) {
      logger.info(`POST /game/robber | can't upload photo`);
      return res.status(200).json({ success: false });
    } else {
      return res.status(200).json({ success: true });
      // const aiServerResponse = await isUserAIServer(code);
      // console.log(aiServerResponse);
      // if (!aiServerResponse) {
      //   //못잡음
      //   return res.status(200).json({ success: false });
      // } else {
      //   //잡음
      //   const nickname = aiServerResponse.nickname;
      //   console.log(nickname);
      // const gameUser = await GameDao.findGameUser(code, nickname);
      // if (!gameUser) {
      //   return res.status(200).json({ success: false });
      // } else {
      //   const treasures = await GameDao.findTreasureInfos(code);
      //   const newTreasures = getTreasureArray(
      //     gameUser.treasureCount,
      //     Object.keys(treasures).length,
      //     treasures
      //   );
      //   const isUpdatedTreasures = await GameDao.updateTreasureInfos(
      //     code,
      //     newTreasures
      //   );
      //   const isUpdatedUser = await GameDao.updateGameUser(
      //     code,
      //     nickname,
      //     Role.TRAITOR,
      //     0
      //   );
      //   return res
      //     .status(200)
      //     .json({ success: isUpdatedUser && isUpdatedTreasures });
      // }
      // }
    }
  } catch (e) {
    logger.error(e.message);
    return res.status(400).json({ success: false, msg: e.message });
  }
}

// 게임 끝
async function endGame(req: Request, res: Response) {
  try {
    const code: string = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await Service.getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /game | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const gameUser = await GameDao.findGameUser(code, user.nickname);
    const winTeam = await RoomDao.getGame(code);
    const result = gameUser.role == winTeam;
    logger.info(`GET /game/end | finish game. win team is ${Role[winTeam]}`);
    return res.status(200).json({
      win: result,
    });
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
router.get('/cabinet', findTreasureCount);
// router.post('/robber', [uploadRoom.array('photos')], catchRobber);
router.get('/end', endGame); //게임 종료

export { router as gameRouter };
