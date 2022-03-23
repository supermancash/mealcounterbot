import bot from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";

const show = async () => {
    bot.command('show', async (ctx) => {
        // reply string that text can be added to
        let reply = "";

        // get current counters status from db
        const counters = await CounterSchema.find();

        // filter for users that owe
        let owers = counters.filter(obj => obj.meals_owed.length > 0);

        // tell user if nobody owes anything
        if (owers.length < 1) {
            reply += "Looks like nobody currently owes any meals😲";
        }

        // loop through counters and add them to reply string if any counters exist
        if (owers.length > 0) {
            reply += "Here is the current list of meals owed: 🍗🍗🍗\n";
            for (let i = 0; i < counters.length; i++) {
                if (counters[i].meals_owed.length > 0) {
                    reply += "\n*" + counters[i].first_name + " owes:*\n"
                    for (let j = 0; j < counters[i].meals_owed.length; j++) {
                        reply += "   " + counters[i].meals_owed[j].meal_receiver + " "
                            + counters[i].meals_owed[j].amount + " meal";
                        if (counters[i].meals_owed[j].amount > 1) reply += "s";
                        reply += "\n";
                        for (let k = 0; k < counters[i].meals_owed[j].bets.length; k++) {
                            reply += "      _-->" + counters[i].meals_owed[j].bets[k] + "_\n";
                        }
                    }
                }
            }
        }

        // finally send reply string
        await ctx.replyWithMarkdown(reply);
    });
}

export default show;