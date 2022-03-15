import bot from "./bot.js";
import show from "./commands/show.js";
import update from "./commands/update.js";
import payup from "./commands/payup.js";
import mongoConnection from "./dao/mongoConnection.js";
import help from "./commands/help.js";
import proof from "./commands/proof.js";

import http from "http";
import 'dotenv/config';


// TODO: (everywhere) code cleanup and annotations


// only to fool heroku, making the application seem like a webapp
const server = http.createServer();
server.listen(process.env.PORT == null ? 5000 : process.env.PORT);

bot.launch().catch(err => console.log(err));

mongoConnection();

show();
help();
update().catch(err => console.log(err));
payup().catch(err => console.log(err));
proof().catch(err => console.log(err));