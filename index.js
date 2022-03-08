import bot from "./bot.js";
import update from "./commands/update.js";

import http from "http";

// only to fool heroku, making the application seem like a webapp
const server = http.createServer();
server.listen(process.env.PORT == null ? 5000 : process.env.PORT);

bot.launch().catch(err => console.log(err));

update();