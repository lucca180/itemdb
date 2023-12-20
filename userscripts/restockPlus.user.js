// ==UserScript==
// @name         itemdb - Restock Tracker
// @version      1.0.0
// @author       itemdb
// @namespace    itemdb
// @description  Tracks your restock metrics
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/*
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
let itemsObj = {};
let priceList = [];

let unsync_sessions = GM_getValue('unsync_sessions', []); // restockSession[]
let current_sessions = GM_getValue('current_sessions', {}); // {[shopId]: restockSession}

const CURRENT_MODEL_VERSION = 1;

// check the page language
const pageLang = typeof nl != 'undefined' ? nl : 'unknown';

// function to check if the current url contains a word
function URLHas(string) {
  return window.location.href.includes(string);
}

// this is used to convert shop ids to item categories
const shopIDToCategory={'1':'food','2':'magic item','3':'toy','4':'clothes','5':'grooming','7':'book','8':'collectable card','9':'battle magic','10':'defence magic','12':'gardening','13':'medicine','14':'candy','15':'baked','16':'healthy food','17':'gift','18':'smoothie','20':'tropical food','21':'island merchandise','22':'space food','23':'space battle','24':'space defence','25':'petpet','26':'robot petpet','27':'aquatic petpet','30':'spooky food','31':'spooky petpet','34':'coffee','35':'slushie','36':'ice crystal','37':'snow food','38':'faerie book','39':'faerie food','40':'faerie petpet','41':'furniture','42':'tyrannian food','43':'tyrannian furniture','44':'tyrannian petpet','45':'tyrannian weaponry','46':'hot dog','47':'pizza','48':'usuki doll','49':'desert food','50':'desert petpet','51':'desert scroll','53':'school','54':'desert weapon','55':'desert pottery','56':'medieval food','57':'medieval petpet','58':'stamp','59':'haunted weaponry','60':'spooky furniture','61':'wintery petpet','62':'jelly food','63':'refreshments','66':'kiko lake food','67':'kiko lake carpentry','68':'collectibles','69':'petpet supplies','70':'booktastic book','71':'kreludan furniture','72':'kreludan food','73':'meridell potion','74':'darigan toy','75':'faerie furniture','76':'roo island merchandise','77':'brightvale books','78':'brightvale scroll','79':'brightvale windows','80':'brightvale armour','81':'brightvale fruit','82':'brightvale motes','83':'brightvale potions','84':'instrument','85':'medical cures','86':'sea shells','87':'maractite weaponry','88':'maraquan petpets','89':'geraptiku petpet','90':'qasalan food','91':'qasalan weaponry','92':'qasalan tablets','93':'faerie weapon shop','94':'altadorian armour','95':'altadorian food','96':'altadorian magic','97':'altadorian petpets','98':'plushies','100':'wonderous weaponry','101':'exotic foods','102':'remarkable restoratives','103':'fanciful fauna','104':'neovian antiques','105':'neovian pastries','106':'neovian press','107':'neovian attire','108':'mystical surroundings','110':"lampwyck's lights fantastic",'111':"cog's togs",'112':'molten morsels','113':'moltaran petpets','114':'moltaran books','116':'springy things','117':'ugga shinies',};

function getSession(shopId) {
  if (current_sessions[shopId]) {
    if(current_sessions[shopId].lastRefresh >= Date.now() - SESSION_TIMEOUT * 60 * 1000)
      return current_sessions[shopId];

    else {
      if(Object.keys(current_sessions.items).length !== 0) {
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

// -------------------------- //

function handleGeneralShops() {
  const shopID = window.location.href.match(/(?<=obj_type\=)\d+/)?.[0];
  const items = $('.shop-item');
  const session = getSession(shopID);
  
  items.each(function (i) {
    const itemData = $(this).find('.item-img');
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

  current_sessions[shopID] = session;
  GM_setValue('current_sessions', current_sessions);
}

function handleRestockHaggle(){
  let url = window.location.href;
  if(!url.includes("obj_info_id")) url = document.referrer;
  
  const id = url.match(/(?<=obj_info_id\=)\d+/)?.[0];
  const stockId = url.match(/(?<=stock_id\=)\d+/)?.[0];
  
  const shopId = $(".shop-bg").css("background-image").split('/').at(-1).match(/\d+/)[0]
  const isHaggle = $('.haggleForm').length > 0;
  const isSoldOut = $('.item-desc').next('p').text().includes("SOLD OUT");
  const isBought = $('.item-desc').next('p').next('p').text().includes("added to your inventory");

  const session = getSession(shopId);
  
  let clickIndex = session.clicks.findIndex(click => click.item_id === id && click.restock_id === stockId && (!click.buy_timestamp && !click.soldOut_timestamp));
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

  if(isHaggle) {
    click.haggle_timestamp = Date.now();
  }

  if(isBought) {
    click.buy_timestamp = Date.now();
  }

  session.clicks[clickIndex] = click;
  current_sessions[shopId] = session;

  GM_setValue('current_sessions', current_sessions);
}

function handleitemdb(){
  Object.entries(current_sessions).forEach(([shopId, session]) => {
    if(session.lastRefresh < Date.now() - SESSION_TIMEOUT * 60 * 1000) return;
    else 
      getSession(shopId);
  });

  sessionStorage.setItem('unsync_sessions', JSON.stringify(unsync_sessions));
  sessionStorage.setItem('current_sessions', JSON.stringify(current_sessions));
}

function cleanAll(){
  GM_setValue('unsync_sessions', []);
  GM_setValue('current_sessions', {});

  unsync_sessions = [];
  current_sessions = {};

  sessionStorage.setItem('unsync_sessions', JSON.stringify(unsync_sessions));
  sessionStorage.setItem('current_sessions', JSON.stringify(current_sessions));

  console.log('cleaned all');
}

unsafeWindow.itemdb_restock_cleanAll = cleanAll;

if (URLHas('obj_type')) handleGeneralShops();
if (URLHas('haggle.phtml')) handleRestockHaggle();
if (URLHas('itemdb.com.br') || URLHas('localhost:3000')) handleitemdb();