import {Telegraf} from "telegraf";
import bot from "../bot.js";

const update = () => {
    bot.command('update', Telegraf.reply("test"));
}

export default update;