import {Telegraf} from "telegraf";

const bot = new Telegraf("5206027815:AAHzEI2LNVOavq-c8ScWb76AUfPUjka8xtI");

bot.start((ctx) => {
        ctx.replyWithMarkdown("Hi " + ctx.update.message.from.first_name +
            "! \n\nWelcome to the `mealcounterbot`, I'll be happy to assist with counting how many meals are owed by " +
            "colleauges in your team :)" +
            "\n\n*Use these commands to control me:*" +
            "\n\n/show - show the current status of owed meals" +
            "\n/update - update the status of owed meals" +
            "\n/notifications - activate notifications to never miss an update again!"
        );
    }
);

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

export default bot;