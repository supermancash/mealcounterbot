import {Telegraf}  from 'telegraf';

const bot = new Telegraf("5206027815:AAHzEI2LNVOavq-c8ScWb76AUfPUjka8xtI")
bot.command('oldschool', (ctx) => ctx.reply('Hello'))
bot.command('hipster', Telegraf.reply('λ'))
bot.launch().catch(err => console.log(err))

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))