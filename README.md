# itemdb - Neopets Open-Source item database

[itemdb](https://itemdb.com.br/) is a database of information about Neopets items. It is built using **Next.js**, **MySQL** and **[Prisma](https://www.prisma.io/docs)**, and its foundation is a [userscript](https://github.com/lucca180/itemdb/blob/main/userscripts/itemDataExtractor.user.js) that can be used with browser extensions like Tampermonkey.

## Running Locally

First of all, you will need:

- MySQL 8
- Node.js 18
- Yarn
- [Firebase](https://console.firebase.google.com/u/0/)

Then clone this repo, then run `yarn` to install all dependencies.

Create your Firebase project. Make sure you have enabled email/password authentication. Then you will need to **generate the private key file** and place it in the root directory with the name `firebase-key.json`.

Next, you will need to configure the `.env` file with your MySQL server connection string (check out [.env.default](https://github.com/lucca180/itemdb/blob/main/.env.default)) and make sure you have a database ready.

With all set, run `npx prisma migrate dev` to sync itemdb schema with your MySQL database. If everything went well, you can run the command `yarn dev`, and your local copy of itemdb will be available at `http://localhost:3000`.

But it will be empty :(

To populate your database, install the [Item Data Extractor Script](https://github.com/lucca180/itemdb/blob/main/userscripts/itemDataExtractor.user.js) and change the `GM_xmlhttpRequest` urls at the end of the file from `https://itemdb.com.br` to `http://localhost:3000` and browse Neopia a little :)
