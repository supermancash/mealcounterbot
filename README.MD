#Mealcounterbot
##Background / Resources
###Telegram Bot docs and resources
To receive a bot token, message [botfather](https://t.me/botfather) 
as described in the steps outlined in the [telegram docs](https://core.telegram.org/bots#6-botfather).
###Database
I used [mongodb atlas](https://www.mongodb.com/atlas/database) as a hosting service for the database because 
they let you set up one cluster for free.

###Hosting Service
Of course this depends on personal preferences more than anything, I myself can definitely recommend 
[heroku](https://heroku.com). Their `worker` setting is perfect for the use-case of 
a bot, replies quickly and best of all once again is free to use.
##Running locally
In order to run the mealcounterbot locally follow these steps:
1. Create a .env file and add these two lines

`MONGO_URI = <your local or cloud mongo uri>`
   
`TELEGRAM_BOT_TOKEN = <your bot token>`
2. Run `npm run dev`

##Running on Heroku
Set the above environment variables in the heroku settings pannel of your app.
After the variables are set the deployment should work, meaning your bot will reply even when you are not running the 
project on your local machine.