import express, { Request, Response } from 'express';
import logger from '../utils/logger';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import * as GameDao from '../dao/game';
import { ITreasure, ITreasures } from '../models/treasure';
import { ICabinet } from '../models/cabinet';
import { IGameUser, Role } from '../models/gameUser';
import { IGame } from '../models/game';

/**
 * 도둑 - [1]보물 수집, [2]금고에 보물 보관,
 * 보안관 - [3]금고 발견(+금고 안 보물 재배치), [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치),
 * 배신자 - [5]금고 위치 보안관에게 알리기
 */
function getRandomPosition() {
  //임시 랜덤
  const position =
    Math.random().toString(36).substring(7, 10) +
    Math.random().toString(36).substring(2, 5);
  return position;
}
function getRandomNum(length: number) {
  const num = Math.floor(Math.random() * length);
  return num;
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
      const treasureArr: ITreasure[] = [];
      for (let i = 0; i < Math.round(room.setting.goal * 1.5); i++) {
        const treasure: ITreasure = {
          _id: i,
          position: getRandomPosition(),
          foundUser: '',
        };
        treasureArr.push(treasure);
      }
      const cabinet: ICabinet = {
        position: getRandomPosition(),
        stores: [],
      };
      const treasures: ITreasures = {
        foundCount: 0,
        treasures: treasureArr,
      };
      const users: IGameUser = {};
      const policeIndex = getRandomNum(room.users.length);
      for (let i = 0; i < room.users.length; i++) {
        users[room.users[i].nickname] = {
          role: Role.THIEF,
          havingTreasures: [],
        };
        if (i === policeIndex) {
          users[room.users[i].nickname].role = Role.POLICE;
        }
      }
      const game: IGame = {
        cabinet: cabinet,
        treasures: treasures,
        users: users,
      };
      const isInsert = await GameDao.insert(code, game);
      if (!isInsert) {
        logger.info(
          `POST /game | Failed to initialize game room code : ${code}`
        );
        return res
          .status(400)
          .json({ success: false, msg: `게임 초기화를 실패하였습니다.` });
      } else {
        for (let user of room.users) {
          user.isReady = true;
        }
        room.master.isReady = true;
        RoomDao.update(code, null, room.users, room.master);
        const startGame = await GameDao.find(code);
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
    const startGame = await GameDao.find(code);
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
      return res.status(200).json({ game: startGame, info: info });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e.message });
  }
}
// [1]도둑 - 보물 수집(가방에)
function findTreasure(req: Request, res: Response) {}
// [2]도둑 - 금고에 보물 보관 TODO
function keepTreasureInCabinet() {}
// [3]보안관 - 금고 발견(+금고 안 보물 재배치)
function findCabinet() {}
// [4]도둑 잡기(도둑 -> 배신자+ 금고위치 재배치+도둑이 들고있던 보물 재배치)
function catchRobber() {}
// [5]금고 위치 보안관에게 알리기
function notifyCabinetLocation() {}
// 게임 끝
function endGame() {}

const router = express.Router();

router.post('/', startGameMaster); //게임 시작
router.get('/', startGameUser);
router.put('/treasure', findTreasure);
router.put('/treasure/:id', keepTreasureInCabinet);
router.put('/cabinet', findCabinet);
router.post('/robber', catchRobber);
router.post('/cabinet', notifyCabinetLocation);
router.get('/', endGame); // 게임 종료 - TODO

export { router as gameRouter };
