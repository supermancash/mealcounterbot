import bot from "../bot.js";

const proof = async () => {
    bot.command("proof", (ctx) => {
        ctx.reply("Proof Images feature is on its way!")
        //ctx.replyWithPhoto({url: <urlfromdatabase>});
    })
}

export default proof;