# Jester
#### What is Jester?
Jester bot for dAmn, [DeviantART's](http://www.deviantart.com) chat network. It is written in Javascript using [Node.js](https://nodejs.org/en/).

It features a web-based control panel that you can use to configure the bot, login with your DeviantART account, and view the bot event log. There is also a chat tab that replicates the dAmn web interface, from the perspective of the bot.

#### Getting Started
##### Requirements
In order to run the bot you must have [Node.js](https://nodejs.org/en/) installed. You can [download Node.js here](https://nodejs.org/en/download/).
When you install Node.js, NPM (Node Package Manager) will also be installed. This will be required for installing the bot.

##### Downloading the bot
###### Using Git
If you would like to be able to update the bot when changes are made to this repository then the best way to download the bot would be to use [Git](https://git-scm.com/). If you haven't go Git installed yet, you can [download Git here](https://git-scm.com/downloads).

Once you have Git installed, navigate to the folder where you would like the bot to be installed using Command Prompt (Windows) or Terminal (Mac).
Then run the command `git clone https://github.com/SamM/Jester.git`

When you want to update the bot, navigate to the bot folder and use the command `git pull origin master` to pull the latest version from Github.
###### Downloading the .zip
Another option is to download the .zip archive of this repository. [Download ZIP](https://github.com/SamM/Jester/archive/master.zip). Then unzip the archive to the directory you would like to store the bot files.

##### Installing the bot
Once you have downloaded the bot, navigate to the bot folder using Command Prompt (Windows) or Terminal (Mac) and run the command `npm install`. This will download all of the dependencies for the bot.

**Note:** You will need to run `npm install` every time you update with a new version of the bot.

##### Running the bot
Once the bot is installed, you can run the bot by using the command `npm start` or `node run.js`. I find that using `node run.js` makes the bot start up faster.

Once it is running you will be given a URL that will likely be http://localhost:4000. You can open up this link in a web browser to gain access to the bot control panel. From there you can configure your bot, login with a DeviantART account, and connect your bot to dAmn.

#### Good luck
I'll leave the rest up to you to figure out. If you do need some help you can find me on DeviantART at http://sumopiggy.deviantart.com and send me a note, or you might be able to find me on dAmn in **[#Botdom](http://chat.deviantart.com/chat/Botdom)**.
