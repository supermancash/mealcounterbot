import {Telegraf} from "telegraf";
import bot from "../index";

bot.command('oldschool', (ctx) => ctx.reply('Hello'));
bot.command('hipster', Telegraf.reply('λ'));