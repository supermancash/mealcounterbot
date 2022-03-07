import bot from "./bot.js";
import update from "./commands/update.js";

bot.launch().catch(err => console.log(err));

update();