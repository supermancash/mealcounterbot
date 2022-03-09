import bot from "./bot.js";
import show from "./commands/show.js";
import update from "./commands/update.js";
import notifications from "./commands/notifications.js";

import http from "http";
import mongoConnection from "./dao/mongoConnection.js";


// only to fool heroku, making the application seem like a webapp
const server = http.createServer();
server.listen(process.env.PORT == null ? 5000 : process.env.PORT);

bot.launch().catch(err => console.log(err));

show();
update();
notifications();
mongoConnection();