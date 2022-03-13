import bot from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";

const show = () => {
    bot.command('show', async (ctx) => {
        let reply = "Here is the current list of meals owed: \n";
        const counters = await CounterSchema.find();
        for (let i = 0; i < counters.length; i++) {
            if (counters[i].meals_owed.length > 0) {
                reply += "\n*" + counters[i].first_name + " owes:*\n"
                for (let j = 0; j < counters[i].meals_owed.length; j++) {
                    reply += "   " + counters[i].meals_owed[j].meal_receiver + " "
                        + counters[i].meals_owed[j].amount + " meal";
                    if(counters[i].meals_owed[j].amount > 1 ) reply += "s";
                    reply += "\n";
                }
            }
            if (counters[i].meals_owed.length < 1) {
                reply += "\n*" + counters[i].first_name + " owes no meals :D*  \n";
            }
        }
        await ctx.replyWithMarkdown(reply);
    });
}

export default show;