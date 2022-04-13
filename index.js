import 'dotenv/config';

import bot from "./bot.js";
import show from "./commands/show.js";
import lost from "./commands/lost.js";
import payup from "./commands/payup.js";
import mongoConnection from "./dao/mongoConnection.js";
import help from "./commands/help.js";
import proof from "./commands/proof.js";
import won from "./commands/won.js";

bot.launch().catch(err => console.error(err));

// db helper function
mongoConnection();
// different bot commands
show();
help();
lost();
won()
payup();
proof();