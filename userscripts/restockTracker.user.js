// ==UserScript==
// @name         itemdb - Restock Tracker
// @version      2.0.0
// @author       itemdb
// @namespace    itemdb
// @description  Tracks your restock metrics
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/objects.phtml*
// @match        *://*.neopets.com/haggle.phtml*
// @match        *://*.neopets.com/winter/igloo2.phtml*
// @match        *://*.neopets.com/winter/process_igloo.phtml*
// @match        *://*.neopets.com/halloween/garage.phtml*
// @match        *://itemdb.com.br/*
// @icon         https://itemdb.com.br/favicon.ico
// @connect      itemdb.com.br
// @connect      neopets.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValues
// @noframes
// ==/UserScript==

/*
  type restockSession = {
    startDate: number;
    lastRefresh: number;
    shopId: number;
    refreshes: number[];
    items: {[restock_id: number]:{
      item_id: number;
      stock_price: number;
      timestamp: number;
    }};
    clicks: {
      item_id: number;
      restock_id: number;
      soldOut_timestamp: number | null;
      haggle_timestamp: number | null;
      buy_timestamp: number | null;
      buy_price: number | null
    }[];

    version: number;
  }
*/

// -------------- CONFIG -------------- //
// feel free to change these values to your liking
const SESSION_TIMEOUT = 60 // how many minutes since the last refresh to consider the session ended


// ------------------------------------- //
 // this is used to expose functions to itemdb
unsafeWindow.itemdb_restock = {
  scriptVersion: 200,
};

function getCurrentSessions() {
  const allSessions = {};
  for(const key of GM_listValues()) {
    if(key.includes('_session') && !key.includes('unsync') && !key.includes('current')) {
      const shopId = key.split('_')[0];
      allSessions[shopId] = GM_getValue(key);
    }
  }

  return allSessions; // {shopId: restockSession}
}

function getUnsyncSessions() {
  return GM_getValue('unsync_sessions', []); // restockSession[]
}

const CURRENT_MODEL_VERSION = 2;

// function to check if the current url contains a word
function URLHas(string) {
  return window.location.href.includes(string);
}

function getSession(shopId) {
  const currentSession = GM_getValue(`${shopId}_session`, null);

  if (currentSession) {
    if(
      currentSession.lastRefresh >= Date.now() - SESSION_TIMEOUT * 60 * 1000 &&
      JSON.stringify(currentSession).length < 100000
    )
      return currentSession;

    else {
      if(Object.keys(currentSession.items).length !== 0) {
        const unsync_sessions = getUnsyncSessions();
        unsync_sessions.push(currentSession);
        GM_setValue('unsync_sessions', unsync_sessions);
      }
    }
  }

  const session = {
    startDate: new Date().getTime(),
    lastRefresh: 0,
    shopId,
    refreshes: [],
    items: {},
    clicks: [],
    version: CURRENT_MODEL_VERSION,
  };

  GM_setValue(`${shopId}_session`, session);
  return session;
}

function setSession(shopId, session) {
  GM_setValue(`${shopId}_session`, session);
}

function getLastClick(shopId) {
  const click = GM_getValue(`${shopId}_lastClick`, null);
  return click;
}

function setLastClick(shopId, click) {
  GM_setValue(`${shopId}_lastClick`, click);
}

// -------------------------- //

function handleGeneralShops() {
  const shopID = $(".shop-bg").css("background-image").split('/').at(-1).match(/\d+/)[0];
  const items = $('.shop-item');
  const session = getSession(shopID);
  
  items.each(function (i) {
    const itemData = $(this).find('.item-img, .item-obelisk');
    const itemEl = itemData[0];
    const itemID = itemEl.dataset.link.match(/(?<=obj_info_id\=)\d+/)?.[0];
    const stockId = itemEl.dataset.link.match(/(?<=stock_id\=)\d+/)?.[0];

    const price = itemEl.dataset.price.replace(/[^0-9]/g, '');

    if(!session.items[stockId]) session.items[stockId] = {
      item_id: itemID,
      timestamp: Date.now(),
      stock_price: price
    };
  });  

  const lastRefresh = Date.now();
  session.refreshes.push(lastRefresh);
  session.lastRefresh = lastRefresh;

  setSession(shopID, session);
}

function handleRestockHaggle(){
  let url = window.location.href;
  if(!url.includes("obj_info_id")) url = document.referrer;
  
  const shopId = $(".shop-bg").css("background-image").split('/').at(-1).match(/\d+/)[0];

  let id = url.match(/(?<=obj_info_id\=)\d+/)?.[0];
  let stockId = url.match(/(?<=stock_id\=)\d+/)?.[0];

  if(!id || !stockId) {
    const lastClick = getLastClick(shopId);
    if(!lastClick) return;
    id = lastClick.item_id;
    stockId = lastClick.restock_id;
  }
  
  const isHaggle = $('.haggleForm').length > 0;
  const isSoldOut = $('#container__2020').text().includes("SOLD OUT");
  const isBought = $('#container__2020').text().includes("added to your inventory");
  const buyVal = $('#container__2020').text().match(/(?<=I accept your offer of\s)\d+(?=\sNeopoints)/)?.[0];

  const session = getSession(shopId);
  
  let clickIndex = session.clicks.findIndex(click => (click.item_id === id) && click.restock_id === stockId && (!click.buy_timestamp && !click.soldOut_timestamp));
  let click = session.clicks[clickIndex];

  if(!click) {
    click = {
      item_id: id,
      restock_id: stockId,
      soldOut_timestamp: null,
      haggle_timestamp: null,
      buy_timestamp: null,
      buy_price: null
    };

    session.clicks.push(click);
    clickIndex = session.clicks.length - 1;
  }

  if(isSoldOut) {
    click.soldOut_timestamp = Date.now();
  }

  if(isHaggle && !click.haggle_timestamp) {
    click.haggle_timestamp = Date.now();
  }

  if(isBought) {
    click.buy_timestamp = Date.now();
    click.buy_price = buyVal;
  }

  if(!isBought || !isSoldOut) {
    setLastClick(shopId, click);
  }
  else {
    setLastClick(shopId, null)
  }

  session.clicks[clickIndex] = click;

  setSession(shopId, session);
}

function handleIgloo() {
  const shopID = '-2';
  const items = $('form[name="items_for_sale"] td')
  const session = getSession(shopID);

  items.each(function (i) {
    const itemData = $(this).find('a');
    const itemEl = itemData[0];
    const itemID = itemEl.href.match(/(?<=obj_info_id\=)\d+/)?.[0];
    const price = $(this).text().match(/(?<=Cost\s*:\s*)[\d,]+/)?.[0];
    // const timestamp in 5 min intervals
    const stockId = Math.round(Date.now()/(1000 * 60 * 5)) + Number(itemID);

    if(!session.items[stockId]) session.items[stockId] = {
      item_id: itemID,
      timestamp: Date.now(),
      stock_price: price
    };
  });

  const lastRefresh = Date.now();
  session.refreshes.push(lastRefresh);
  session.lastRefresh = lastRefresh;

  setSession(shopId, session);
}

function handleIglooHaggle() {
  let url = window.location.href;
  if(!url.includes("obj_info_id")) url = document.referrer;
  
  const shopId = "-2";
  const session = getSession(shopId);

  let id = url.match(/(?<=obj_info_id\=)\d+/)?.[0];
  let stockId = Math.round(Date.now()/(1000 * 60 * 5)) + Number(id);
  
  const sessionItem = session.items[stockId];

  const isBought = document.querySelector("body > center > p").textContent.includes("Thanks for buying")
  const isSoldOut = document.querySelector("body > center > p").textContent.includes("Sorry, we dont have any more of those left :(");

  if(!isBought && !isSoldOut) return;

  const buyVal = sessionItem?.stock_price || null;
  
  let click = {
    item_id: id,
    restock_id: stockId,
    soldOut_timestamp: null,
    haggle_timestamp: null,
    buy_timestamp: null,
    buy_price: null
  };

  session.clicks.push(click);

  let clickIndex = session.clicks.length - 1;
  
  if(isSoldOut) {
    click.soldOut_timestamp = Date.now();
  }

  if(isBought) {
    click.buy_timestamp = Date.now();
    click.buy_price = buyVal;
  }

  session.clicks[clickIndex] = click;

  setSession(shopId, session);
}

function handleAttic() {
  const shopID = '-1';
  const items = $('#items li')
  const session = getSession(shopID);
  const date = Math.round(Date.now()/(1000 * 60 * 5))

  items.each(function (i) {
    const itemData = $(this);
    const itemID = itemData.attr('oii');
    const price =  itemData.attr('oprice').replace(/[^0-9]/g, '');

    // const timestamp in 5 min intervals
    const stockId = date + Number(itemID);

    if(!session.items[stockId]) session.items[stockId] = {
      item_id: itemID,
      timestamp: Date.now(),
      stock_price: price
    };
  });

  $('#frm-abandoned-attic').on('submit', function() {
    const itemID = $("#oii").val();
    const stockId = date + Number(itemID);
    const price = $(`#items li[oii="${itemID}"]`).attr('oprice').replace(/[^0-9]/g, '');

    const click = {
      item_id: itemID,
      restock_id: stockId,
      soldOut_timestamp: null,
      haggle_timestamp: null,
      buy_timestamp: null,
      buy_price: price
    };

    setLastClick(shopID, click);
  });

  const lastRefresh = Date.now();
  session.refreshes.push(lastRefresh);
  session.lastRefresh = lastRefresh;
  
  handleAtticClick(session);
  setSession(shopId, session);
}

const handleAtticClick = (session) => {
  const shopID = '-1';
  let click = getLastClick(shopID);

  if(!click || $(".errorOuter").length > 0) return false;
  const isBought = $('p:contains("Take good care of it, I have placed it in your inventory!")').length > 0;
  const isSoldOut = $('p:contains("Sorry, we just sold out of that.")').length > 0;

  if(!isBought && !isSoldOut) {
    setLastClick(shopID, null);
    return false;
  }

  session.clicks.push(click);
  let clickIndex = session.clicks.length - 1;

  if(isBought) {
    click.buy_timestamp = Date.now();
  }
  else {
    click.soldOut_timestamp = Date.now();
    click.buy_price = null;
  }

  session.clicks[clickIndex] = click;

  setLastClick(shopID, null);
  return true;
}

function getSessions() {
  let current_sessions = getCurrentSessions();
  
  Object.entries(current_sessions).forEach(([shopId, session]) => {
    if(
      session.lastRefresh >= Date.now() - SESSION_TIMEOUT * 60 * 1000 &&
      JSON.stringify(session).length < 100000
    ) return;


    else current_sessions[shopId] = getSession(shopId);
  });

  let unsync_sessions = getUnsyncSessions();
  
  // backwards compatibility with script version pre 2.0.0
  let backwardsCompatibility = Object.values(GM_getValue('current_sessions', {}));
  unsync_sessions.push(...backwardsCompatibility);

  return {unsync_sessions, current_sessions};
}

unsafeWindow.itemdb_restock.getSessions = getSessions;

function cleanAll(){
  GM_deleteValues(GM_listValues());

  console.log('[idb_restockTracker] cleaned all');
}

unsafeWindow.itemdb_restock.cleanAll = cleanAll;

if (URLHas('obj_type')) handleGeneralShops();
if (URLHas('haggle.phtml')) handleRestockHaggle();
if (URLHas('igloo2.phtml')) handleIgloo();
if (URLHas('process_igloo.phtml')) handleIglooHaggle();
if (URLHas('garage.phtml')) handleAttic();

if (URLHas('idb_clear')) cleanAll();
