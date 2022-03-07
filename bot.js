import {Telegraf} from "telegraf";

const bot = new Telegraf("5206027815:AAHzEI2LNVOavq-c8ScWb76AUfPUjka8xtI");

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;