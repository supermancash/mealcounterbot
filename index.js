import 'dotenv/config';

import bot from "./bot.js";
import show from "./commands/show.js";
import update from "./commands/update.js";
import payup from "./commands/payup.js";
import mongoConnection from "./dao/mongoConnection.js";
import help from "./commands/help.js";
import proof from "./commands/proof.js";

bot.launch().catch(err => console.log(err));

// db helper function
mongoConnection();
// different bot commands
show().catch(err => console.log(err));
help().catch(err => console.log(err));
update().catch(err => console.log(err));
payup().catch(err => console.log(err));
proof().catch(err => console.log(err));