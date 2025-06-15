# itemdb - Neopets Open-Source item database

[itemdb](https://itemdb.com.br/) is a database of information about Neopets items. It is built using **Next.js**, **MySQL** and **[Prisma](https://www.prisma.io/docs)**, and its foundation is a [userscript](https://github.com/lucca180/itemdb/blob/main/userscripts/itemDataExtractor.user.js) that can be used with browser extensions like Tampermonkey.

## Running Locally

First of all, you will need:

- MySQL 8
- Node.js 22+
- Yarn
- [Firebase project](https://console.firebase.google.com/u/0/)

Then clone this repo, then run `yarn` to install all dependencies.

Create your Firebase project. Make sure you have enabled email/password authentication. Then you will need to **generate the private key file** and place it in the root directory with the name `firebase-key.json`.

You need also to fill the `utils\firebase\app.ts` file with your Firebase project configuration.

Next, you will need to configure the `.env` file with your MySQL server connection string (check out [.env.default](https://github.com/lucca180/itemdb/blob/main/.env.default)) and make sure you have a database ready.

With all set, run `npx prisma migrate dev` to sync itemdb schema with your MySQL database. If everything went well, you can run the command `yarn dev`, and your local copy of itemdb will be available at `http://localhost:3000`.

But it will be empty :(

We have a handy db dump available at [Public Data](https://itemdb.com.br/pt/public-data) page that you can use to import to your local database.

### Tips

- When importing the dump, be sure to skip foreign key checks to prevent errors. Also the correct order should be `items`, `itemcolors`, `itemprices`
- If you try to login, the login url will be on your node console output. You can then change your user to admin in the database to gain some superpowers.
- If you want to test something that isn't disclosed you can reach us via [Feedback](https://itemdb.com.br/pt/feedback)