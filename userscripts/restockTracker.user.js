// ==UserScript==
// @name         itemdb - Restock Tracker
// @version      1.0.8
// @author       itemdb
// @namespace    itemdb
// @description  Tracks your restock metrics
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/objects.phtml*
// @match        *://*.neopets.com/haggle.phtml*
// @match        *://itemdb.com.br/*
// @icon         https://itemdb.com.br/favicon.ico
// @connect      itemdb.com.br
// @connect      neopets.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
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
      timestamp: number;
    }};
    clicks: {
      item_id: number;
      restock_id: number;
      soldOut_timestamp: number | null;
      haggle_timestamp: number | null;
      buy_timestamp: number | null;
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
  scriptVersion: 108,
};

function getCurrentSessions() {
  return GM_getValue('current_sessions', {}); // {[shopId]: restockSession}
}

function getUnsyncSessions() {
  return GM_getValue('unsync_sessions', []); // restockSession[]
}

const CURRENT_MODEL_VERSION = 1;

// function to check if the current url contains a word
function URLHas(string) {
  return window.location.href.includes(string);
}

function getSession(shopId) {
  let current_sessions = getCurrentSessions();
  let unsync_sessions = getUnsyncSessions();

  if (current_sessions[shopId]) {
    if(
      current_sessions[shopId].lastRefresh >= Date.now() - SESSION_TIMEOUT * 60 * 1000 &&
      JSON.stringify(current_sessions[shopId]).length < 100000
    )
      return current_sessions[shopId];

    else {
      if(Object.keys(current_sessions[shopId].items).length !== 0) {
        unsync_sessions.push(current_sessions[shopId]);
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

  current_sessions[shopId] = session;
  GM_setValue('current_sessions', current_sessions);
  return session;
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

    if(!session.items[stockId]) session.items[stockId] = {
      item_id: itemID,
      timestamp: Date.now(),
    };
  });  

  const lastRefresh = Date.now();
  session.refreshes.push(lastRefresh);
  session.lastRefresh = lastRefresh;

  let current_sessions = getCurrentSessions();
  current_sessions[shopID] = session;
  GM_setValue('current_sessions', current_sessions);
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
  }

  if(!isBought || !isSoldOut) {
    setLastClick(shopId, click);
  }
  else {
    setLastClick(shopId, null)
  }

  session.clicks[clickIndex] = click;

  let current_sessions = getCurrentSessions();
  current_sessions[shopId] = session;

  GM_setValue('current_sessions', current_sessions);
}

function getSessions() {
  let current_sessions = getCurrentSessions();
  
  Object.entries(current_sessions).forEach(([shopId, session]) => {
    if(
      session.lastRefresh >= Date.now() - SESSION_TIMEOUT * 60 * 1000 &&
      JSON.stringify(session).length < 100000
    ) return;
    else 
      getSession(shopId);
  });

  let unsync_sessions = getUnsyncSessions();
  current_sessions = getCurrentSessions();

  return {unsync_sessions, current_sessions};
}

unsafeWindow.itemdb_restock.getSessions = getSessions;

function cleanAll(){
  GM_setValue('unsync_sessions', []);
  GM_setValue('current_sessions', {});

  console.log('[idb_restockTracker] cleaned all');
}

unsafeWindow.itemdb_restock.cleanAll = cleanAll;

if (URLHas('obj_type')) handleGeneralShops();
if (URLHas('haggle.phtml')) handleRestockHaggle();
if (URLHas('idb_clear')) cleanAll();
