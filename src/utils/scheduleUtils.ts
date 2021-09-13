import schedule from 'node-schedule';
import logger from './logger';
import { Game } from '../models/game';
import { Role } from '../models/user';
import { setGame } from '../dao/room';

export function enrollSchedule(code: string, timeLimit: number) {
  try {
    const finish = new Date();
    finish.setMinutes(finish.getMinutes() + timeLimit);
    const job = schedule.scheduleJob(code, finish, () => {
      const gameInfo = new Game(true, Role.POLICE);
      setGame(code, gameInfo.get());
      return schedule.cancelJob(code);
    });
    return job;
  } catch (e) {
    logger.error(e.message);
  }
}

export function gameOverBeforeTimeOut(code: string) {
  return schedule.cancelJob(code);
}
