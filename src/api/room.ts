import express, { Request, Response } from 'express';
import { IRoomUser } from '../models/user';
import * as yup from 'yup';
import * as RoomDao from '../dao/room';
import { Place, ISetting } from '../models/room';
import logger from '../utils/logger';
import { learningPhotosAIServer } from '../utils/axiosUtils';
import { checkFirebase } from '../utils/firebase';
import { findByEmail } from '../dao/user';

const tokenScheme = yup.string().required();

async function getUser(token: string) {
  const email = await checkFirebase(token);
  const user = await findByEmail(email);
  return user;
}
// [master] - 방만들기
async function createRoom(req: Request, res: Response) {
  try {
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const master: IRoomUser = {
      email: user.email,
      nickname: user.nickname,
      photoPath: user.photoPath,
      isReady: false,
    };
    const room = await RoomDao.insert(master);
    if (!room) {
      logger.error(`POST /room/new | failed to create room.`);
      return res
        .status(400)
        .json({ success: false, msg: `couldn't create room` });
    }
    logger.info(`POST /room/new | success! room code : ${room.code}`);
    return res.status(201).json({ room });
  } catch (e) {
    return res.status(400).json({ success: false, msg: e.message });
  }
}

const codeSchema = yup.string().required();
const changeSettingSchema = yup.object({
  goal: yup.number().required(),
  timeLimit: yup.number().required(),
  place: yup.mixed<Place>().required(),
});
// [master] 설정 변경
async function changeSetting(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const { goal, timeLimit, place } = changeSettingSchema.validateSync(
      req.body
    );
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const room = await RoomDao.find(code);
    if (!room) {
      const failedLog = `Failed to find room code : ${code}.`;
      logger.info(`PUT /room | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    if (room.master.nickname === user.nickname) {
      // 방장인 경우만 변경 가능
      const setting: ISetting = { goal, timeLimit, place };
      const update = await RoomDao.update(code, setting);
      logger.info(`PUT /room | success to change room setting! code : ${code}`);
      return res.status(200).json({ setting: update.setting });
    } else if (
      room.users.filter((isExisted) => isExisted.nickname !== user.nickname)
    ) {
      logger.info(
        `PUT /room | failed to change room setting! code : ${code} - you are not existed in the room.`
      );
      return res
        .status(400)
        .json({ success: false, msg: `you are not existed in the room.` });
    } else {
      logger.info(
        `PUT /room | failed to change room setting! code : ${code} - you are not master.`
      );
      return res
        .status(400)
        .json({ success: false, msg: `you are not master.` });
    }
  } catch (e) {
    return res.status(400).json({ success: false, msg: e });
  }
}
// [player] 방 입장
async function enterRoom(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const room = await RoomDao.find(code);
    if (!room) {
      //방 없음
      logger.info(`POST /room | You can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `Can't find room : ${code}` });
    } else {
      const player: IRoomUser = {
        email: user.email,
        nickname: user.nickname,
        photoPath: user.photoPath,
        isReady: false,
      };
      room.users = room.users.concat([player]);
      const result = await RoomDao.update(code, null, room.users);
      logger.info(`POST /room | Success to enter room code : ${code}`);
      return res.status(200).json({ room: result });
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e });
  }
}

async function leaveRoom(req: Request, res: Response) {
  try {
    const code = codeSchema.validateSync(req.query.code);
    const token = tokenScheme.validateSync(req.headers.token);
    const user = await getUser(token);
    if (!user) {
      const failedLog = `can't find user`;
      logger.info(`POST /room/new | ` + failedLog);
      return res.status(400).json({ success: false, msg: failedLog });
    }
    const room = await RoomDao.find(code);
    if (!room) {
      logger.info(`DELETE /room | Failed! Can't find room code : ${code}`);
      return res
        .status(400)
        .json({ success: false, msg: `Can't find room ${code}` });
    } else {
      room.users = room.users.filter(
        (exitUser) => exitUser.nickname !== user.nickname
      );

      if (room.master.nickname === user.nickname) {
        //방장이 나감
        room.master = room.users[0];
        if (room.users.length < 1) {
          // 방장 밖에 없음
          logger.info(`DELETE /room | success to delete room code : ${code}`);
          return (await RoomDao.deleteRoom(code))
            ? res.status(204).json({})
            : res
                .status(400)
                .json({ success: false, msg: `Couldn't delete room ${code}` });
        }
      }
      const result = await RoomDao.update(code, null, room.users, room.master);
      logger.info(`DELETE /room | success to leave room code : ${code}`);
      return res.status(204).json({});
    }
  } catch (e) {
    logger.error(e);
    return res.status(400).json({ success: false, msg: e });
  }
}

async function findSettingInfo(req: Request, res: Response) {
  const code = codeSchema.validateSync(req.query.code);
  const room = await RoomDao.find(code);
  if (!room) {
    //방 없음
    logger.info(`GET /room | You can't find room code : ${code}`);
    return res
      .status(400)
      .json({ success: false, msg: `Can't find room : ${code}` });
  } else {
    const result = await RoomDao.find(code);
    logger.info(`GET /room | Success to get room setting code : ${code}`);
    return res.status(200).json({ setting: result.setting });
  }
}
const router = express.Router();
router.post('/new', createRoom);
router.put('/', changeSetting);
router.post('/', enterRoom);
router.delete('/', leaveRoom);
router.get('/', findSettingInfo);

export { router as roomRouter };
