// ==UserScript==
// @name         itemdb - Item Data Extractor
// @version      1.0.0
// @namespace    itemdb
// @description  Feeds itemdb.com.br with neopets item data
// @website      https://itemdb.com.br
// @match      *://*.neopets.com/inventory.phtml*
// @match      *://*.neopets.com/safetydeposit.phtml*
// @match      *://*.neopets.com/island/tradingpost.phtml*
// @match      *://*.neopets.com/market_your.phtml*
// @match      *://*.neopets.com/market.phtml*
// @match      *://*.neopets.com/objects.phtml?type=shop&obj_type=*
// @match      *://*.neopets.com/objects.phtml?obj_type=*
// @match      *://*.neopets.com/shops/wizard.phtml*
// @match      *://*.neopets.com/genie.phtml*
// @match      *://*.neopets.com/auctions.phtml*
// @match      *://*.neopets.com/gallery/*
// @icon         https://itemdb.com.br/favicon.ico
// @grant        none
// ==/UserScript==

// Check if we are on the beta site
const isBeta = !!$('#container__2020').length;

// Some variables we will need later
let alreadyCalled = false;
const itemsObj = {};
const priceList = [];
const tradeList = [];

// Loads some history so we can check if we already sended the info to the server
const itemsHistory = JSON.parse(localStorage?.getItem('idb_itemHistory')) ?? {};
const restockHistory =
  JSON.parse(localStorage?.getItem('idb_restockHistory')) ?? {};
const tradeHistory =
  JSON.parse(localStorage?.getItem('idb_tradeHistory')) ?? {};

// check the page language (default as english)
const pageLang = nl ?? 'en';

// function to check if the current url contains a word
function URLHas(string) {
  return window.location.href.includes(string);
}

// ------------ HANDLERS -------------- //

/*
    Handlers are functions that detect the items on some pages and add the data to the itemsObj.
    We have handlers for different pages as the items are displayed differently on each page.
    No personal data is collected - except for the trade, shop and auctions pages where
    the item owner username is collected but only the first 3 letters are sent to the db
    and the rest is replaced with *

    :)
*/

function handleInventory() {
  if (isBeta) {
    $(document).ajaxSuccess(() => {
      $('.grid-item').each(function (i) {
        const itemEl = $(this).find('.item-img')[0];
        const itemSubEl = $(this).find('.item-subname').first();
        const item = {
          name: itemEl.dataset.itemname,
          description: itemEl.dataset.itemdesc,
          estVal: itemEl.dataset.itemvalue.split(' ')[0]?.replace(',', ''),
          rarity: itemEl.dataset.rarity,
          category: itemEl.dataset.itemtype,
          img: itemEl.dataset.image,
          type: itemEl.dataset.itemset,
          weight: itemEl.dataset.itemweight,
          subText: itemSubEl.text(),
        };

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]?.inventory) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
          itemsHistory[itemKey].inventory = true;
          hasNewData();
        }
      });
    });
  }
}

function handleSDB() {
  if (isBeta) return;

  const trs = $('form table').eq(2).find('tr').clone().slice(1, -1);
  trs.each(function (i) {
    const tds = $(this).find('td');
    const img = tds.first().find('img').first().attr('src');

    const itemName = tds
      .eq(1)
      .find('b')
      .first()
      .clone()
      .children()
      .remove()
      .end()
      .text();

    const subText = tds.eq(1).find('.medText').text();
    const description = tds.eq(2).text();
    const category = tds.eq(3).text();
    const itemId = tds.last().find('input').attr('name').match(/\d+/)[0];

    const item = {
      name: itemName,
      img: img,
      description: description,
      subText: subText,
      category: category,
      itemId: itemId,
    };

    const itemKey = genItemKey(item);
    if (!itemsHistory[itemKey]?.sdb) {
      itemsObj[itemKey] = item;
      itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
      itemsHistory[itemKey].sdb = true;
      hasNewData();
    }
  });
}

function handleTrades() {
  if (isBeta) return;

  const lots = $('.content td > table td table');
  lots.each(function (i) {
    const link = $(this).prevAll('a').eq(0).attr('href');

    if (!link) return;

    const owner = link.match(/(?<=offender=)[^=&]+/gi)?.[0];
    const tradeID = link.match(/(?<=tradeLot=)\d+/gi)?.[0];
    const wishList = link.match(/(?<=tradeWishlist=).+/gi)?.[0];
    if (tradeHistory[tradeID]) return;
    tradeHistory[tradeID] = true;

    const trade = {
      tradeID: tradeID,
      wishList: wishList,
      owner: owner.slice(0, 3).padEnd(6, '*'),
      items: [],
    };

    // each item
    $(this)
      .find('tr')
      .each(function (i2) {
        const itemName = $(this).find('td').first().text().trim();

        const img = $(this).find('img').first().attr('src');
        const description = $(this).find('img').first().attr('alt');
        const rarity = $(this).find('td').last().text().match(/\d+/)?.[0];

        const item = {
          img: img,
          description: description,
          name: itemName,
          rarity: rarity ?? undefined,
        };

        trade.items.push({
          img: img,
          description: description,
          name: itemName,
          order: i2,
        });

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]?.trades) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
          itemsHistory[itemKey].trades = true;
          hasNewData();
        }
      });

    tradeList.push(trade);
  });
}

function handleMyShop() {
  if (isBeta) return;

  const itemsTr = $('form table').first().find('tr').slice(1, -3);

  itemsTr.each(function (i) {
    const tds = $(this).find('td');
    const itemName = tds.eq(0).find('b').text();
    const img = tds.eq(1).find('img').attr('src');
    const category = tds.eq(3).find('b').text();
    const description = tds.eq(5).find('i').text();

    const itemID = $(this)
      .find(`[name='obj_id_${i + 1}']`)
      .attr('value');

    const item = {
      name: itemName,
      img: img,
      category: category,
      description: description,
      itemId: itemID,
    };

    const itemKey = genItemKey(item);
    if (!itemsHistory[itemKey]?.myshop) {
      itemsObj[itemKey] = item;
      itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
      itemsHistory[itemKey].myshop = true;
      hasNewData();
    }
  });
}

function handleGeneralShops() {
  const items = $('.shop-item');

  items.each(function (i) {
    const itemData = $(this).find('.item-img');
    const itemEl = itemData[0];
    const itemID = itemEl.dataset.link.match(/(?<=obj_info_id\=)\d+/)?.[0];

    const item = {
      name: itemEl.dataset.name,
      description: itemData.attr('title'),
      img: itemData
        .css('background-image')
        .replace(/^url\(['"](.+)['"]\)/, '$1'),
      itemId: itemID,
    };

    const itemKey = genItemKey(item);
    if (!itemsHistory[itemKey]?.generalshop) {
      itemsObj[itemKey] = item;
      itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
      itemsHistory[itemKey].generalshop = true;
      hasNewData();
    }
  });
}

function handleGallery() {
  const itemsTds = $('form table').first().find('tr td');

  itemsTds.each(function (i) {
    const img = $(this).find('img').attr('src');
    if (!img) return;

    const description = $(this).find('img').attr('title');
    const itemName = $(this).find('b').first().text();

    const item = {
      name: itemName,
      img: img,
      description: description,
    };

    const itemKey = genItemKey(item);
    if (!itemsHistory[itemKey]?.gallery) {
      itemsObj[itemKey] = item;
      itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
      itemsHistory[itemKey].gallery = true;
      hasNewData();
    }
  });
}

function handleGalleryAdmin() {
  let itemsTrs = $('#quickremove_form tr').slice(1, -2);
  if (itemsTrs.length === 0)
    itemsTrs = $("form[name='quickcat_form'] tr:nth-of-type(2n)").slice(0, -1);

  itemsTrs.each(function (i) {
    const itemName = $(this).find('td').eq(2).text();
    const itemId = $(this).find('div').first().attr('id');
    const index = oii_arr.findIndex((id) => id == itemId);
    const itemImg = file_arr[index];

    const item = {
      itemId: itemId,
      name: itemName,
      img: `https://images.neopets.com/items/${itemImg}.gif`,
    };

    const itemKey = genItemKey(item);
    if (!itemsHistory[itemKey]?.galleryAdmin) {
      itemsObj[itemKey] = item;
      itemsHistory[itemKey] = { ...itemsHistory[itemKey] };
      itemsHistory[itemKey].galleryAdmin = true;
      hasNewData();
    }
  });
}

// ------ prices ------ //

function handleSWPrices() {
  $(document).ajaxSuccess(() => {
    const itemName = $('.wizard-results-text h3').text();
    const items = $('.wizard-results-grid-shop li').clone().slice(1);

    items.each(function (i) {
      const shopOwner = $(this).find('a').text();
      const stock = $(this).find('p').text();
      const value = $(this)
        .find('.wizard-results-price')
        .text()
        .replace(/(\,|(NP))/gm, '');
      const itemID = $(this)
        .find('a')
        .attr('href')
        .match(/(?<=obj_info_id\=)\d+/)?.[0];

      const itemPriceInfo = {
        item_id: itemID,
        name: itemName,
        owner: shopOwner.slice(0, 3).padEnd(6, '*'),
        stock: parseInt(stock),
        value: parseInt(value),
        type: 'sw',
      };

      priceList.push(itemPriceInfo);
      hasNewData();
    });
  });
}

function handleAuctionPrices() {
  let auctions;
  if (URLHas('genie.phtml'))
    auctions = $('.content > table tr').clone().slice(1);
  if (URLHas('auctions.phtml'))
    auctions = $('.content > center table tr').clone().slice(1);

  auctions.each(function (i) {
    const tds = $(this).find('td');
    const img = tds.eq(1).find('img').attr('src');
    const itemName = tds.eq(2).find('a').first().text();
    const owner = tds.eq(3).find('.sf').text();
    const isNF = tds.eq(3).find('b')?.text() ? 'NF' : '';
    const timeLeft = tds.eq(4).find('b').text();
    const lastBid = tds.eq(5).find('b').text();
    const bidder = tds.eq(-1).text().trim();

    const otherInfo = [isNF, timeLeft, bidder];

    const itemPriceInfo = {
      name: itemName,
      img: img,
      owner: owner.slice(0, 3).padEnd(6, '*'),
      stock: 1,
      value: parseInt(lastBid),
      otherInfo: otherInfo,
      type: 'auction',
    };

    priceList.push(itemPriceInfo);
    hasNewData();
  });
}

// ------ logging ------ //

function handleRestock() {
  const items = $('.shop-item');

  items.each(function (i) {
    const info = $(this).find('.item-img')[0];
    const itemName = info.dataset.name;
    const price = info.dataset.price.replace(',', '');
    const id = info.dataset.link.match(/(?<=obj_info_id\=)\d+/)?.[0];
    const stock = $(this).find('.item-stock').first().text().match(/d+/)?.[0];

    const now = new Date();

    if (restockHistory[id] == now.getDate()) return;

    restockHistory[id] = now.getDate();

    const itemInfo = {
      item_id: id,
      name: itemName,
      owner: 'restock',
      stock: parseInt(stock),
      value: parseInt(price),
      type: 'restock',
    };

    priceList.push(itemInfo);
    hasNewData();
  });
}

// ------------- //

// Here we check if the page has the url we want and then call the respective function

if (URLHas('inventory')) handleInventory();
if (URLHas('safetydeposit')) handleSDB();
if (URLHas('trading')) handleTrades();
if (URLHas('market')) handleMyShop();
if (URLHas('obj_type')) handleGeneralShops();
if (URLHas('obj_type')) handleRestock();
if (URLHas('wizard.phtml')) handleSWPrices();
if (URLHas('genie.phtml') || URLHas('auctions.phtml')) handleAuctionPrices();
if (URLHas('gallery/index.phtml')) handleGallery();
if (URLHas('gallery/quickremove.phtml') || URLHas('gallery/quickcat.phtml'))
  handleGalleryAdmin();

// ----------- //

// Here we send the data to the server
// We send the items and prices separately because the items are sent only once
// Again - no Personal Identifiable Information is sent to the server. Only item data.

async function submitItems() {
  const itemsList = Object.values(itemsObj);
  if (itemsList.length === 0) return;

  const res = await fetch('https://itemdb.com.br/api/v1/items', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lang: pageLang,
      items: Object.values(itemsObj),
    }),
  });

  if (res.ok)
    localStorage?.setItem('idb_itemHistory', JSON.stringify(itemsHistory));
}

async function submitPrices() {
  if (priceList.length === 0) return;

  const res = await fetch('https://itemdb.com.br/api/v1/prices', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lang: pageLang,
      itemPrices: priceList,
    }),
  });

  if (res.ok)
    localStorage?.setItem('idb_restockHistory', JSON.stringify(restockHistory));
}

async function submitTrades() {
  if (tradeList.length === 0) return;

  const res = await fetch('https://itemdb.com.br/api/v1/trades', {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      lang: pageLang,
      tradeLots: tradeList,
    }),
  });

  if (res.ok)
    localStorage?.setItem('idb_tradeHistory', JSON.stringify(tradeHistory));
}

// here we check if we have any new data, if so, we send it to the server right before the page is closed :)
function hasNewData() {
  if (alreadyCalled) return;
  alreadyCalled = true;
  window.addEventListener('beforeunload', () => {
    try {
      submitItems();
      submitPrices();
      submitTrades();
    } catch (e) {
      //console.error(e)
    }
  });
}

// this function is used to generate a unique key for each item based on its name, image and id
function genItemKey(item) {
  const imgId = item.img?.match(/[^\.\/]+(?=\.gif)/)?.[0] ?? '';
  const id = item.itemId ?? '';
  return (item.name + imgId + id).replace(/\s/g, '');
}