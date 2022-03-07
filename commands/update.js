import {Telegraf} from "telegraf";
import bot from "../bot.js";

const update = () => {
    bot.command('update', Telegraf.reply('λ'));
}

export default update;