import schedule from 'node-schedule';
import logger from './logger';

export function enrollSchedule(code:string, timeLimit: number){
    try{
        const finish = new Date();
        finish.setMinutes(finish.getMinutes()+timeLimit);
        const job = schedule.scheduleJob(code, finish, ()=>{
            // TODO: timeout - finish
            return schedule.cancelJob(code);
        })
        return job;
    }catch(e){
        logger.error(e.message);
    }
}

export function gameOverBeforeTimeOut(code: string){
    return schedule.cancelJob(code);
}