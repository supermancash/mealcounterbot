import bot from "../bot.js";
import CounterSchema from "../dao/models/Counter.js";

const show = () => {
    bot.command('show', async (ctx) => {
        ctx.replyWithMarkdown("Here is the current list of meals owed: ");
        const counters = await CounterSchema.find();
        for (let i = 0; i < counters.length; i++) {
            ctx.replyWithMarkdown("\n*" + counters[i].first_name + ": " + counters[i].meals_owed + "*"
            );
        }
    });
}

export default show;