import bot from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";

const show = () => {
    bot.command('show', async (ctx) => {
        let reply = "Here is the current list of meals owed: \n";
        const counters = await CounterSchema.find();
        for (let i = 0; i < counters.length; i++) {
            reply += "\n*" + counters[i].first_name + ": " + counters[i].meals_owed + "*";
        }
        await ctx.replyWithMarkdown(reply);
    });
}

export default show;