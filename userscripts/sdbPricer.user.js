  // ==UserScript==
  // @name         itemdb - Safety Deposit Box Pricer
  // @version      1.6.0
  // @author       itemdb
  // @namespace    itemdb
  // @description  Shows the market price for your sdb
  // @website      https://itemdb.com.br
  // @match        *://*.itemdb.com.br/*
  // @match        *://*.neopets.com/safetydeposit.phtml*
  // @icon         https://itemdb.com.br/favicon.ico
  // @connect      itemdb.com.br
  // @grant        GM_xmlhttpRequest
  // @noframes
  // @run-at       document-start
  // ==/UserScript==

// function to check if the current url contains a word
function URLHas(string) {
  return window.location.href.includes(string);
}

const script_info = {
  version: GM_info.script.version,
  versionCode: Number(GM_info.script.version.replaceAll(".", ""))
}

unsafeWindow.itemdb_sdbPricer = script_info;

const itemInfo = {};

async function fetchPriceData(IDs) {
  GM_xmlhttpRequest({
    method: 'POST',
    url: 'https://itemdb.com.br/api/v1/items/many',
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      item_id: IDs
    }),
    onload: function (res) {
      if (res.status === 200) {
        const itemData = JSON.parse(res.responseText);
        pricePage(itemData);
      }

      else return console.error('[itemdb] Failed to fetch price data', res);
    }
  });
}

async function watchSDBItems() {
  console.log('[itemdb] Watching for items in the safety deposit box...');
  document.addEventListener('idb:sdbPricer:safetyDeposit', function(e) {
    console.log('[itemdb] Detected items in safety deposit box, fetching price data...', e.detail);
    const items = e.detail.data.items;
    const itemIDs = items.map(i => {

      itemInfo[i.obj_info_id] = i;
      return i.obj_info_id;
    });
    fetchPriceData(itemIDs);
  });
}

function getPriceStr(item, itemQty) {
  const intl = new Intl.NumberFormat();
  let priceStr = '<div style="display: flex;flex-flow: row; gap: .3rem; font-size: 14px; align-items: center; flex-wrap: wrap; max-width: 200px;"><img src="https://itemdb.com.br/logo_icon.svg" style="vertical-align: middle;" width="20px" height="auto"/> ';

    /*
      * If items are missing from the DB, wrap the conditions inside a try -> catch.
      * With this approach, the execution of the script is not interrupted in case an "item.slug" is not parseable.
      */
    try {
      if(!item) throw 'no item';

      // if(item.rarity) {
      //   var color1 = setColor(item.rarity)

      //   priceStr += `<small style='color:${color1}'><b>r${item.rarity}</b>`;
      //   if(item.ff_points) priceStr += ` - <b>${item.ff_points} pts</b>`;
      //   priceStr += `</small> `
      // }

      if(item.status === 'no trade'){
        priceStr += `<a href="https://itemdb.com.br/item/${item.slug}?utm_content=sdbPricer" target="_blank">No Trade</a>`;
      }

      if(item.isNC && !item.ncValue && item.status === 'active'){
        priceStr += `<a href="https://itemdb.com.br/item/${item.slug}?utm_content=sdbPricer" target="_blank">NC</a>`;
      }

      if(item.isNC && item.ncValue){
        priceStr += `<a href="https://itemdb.com.br/item/${item.slug}?utm_content=sdbPricer" target="_blank">${item.ncValue.range} caps</a>`;
      }

      if(item && item.status !== 'no trade' && !item.price.value && !item.isNC){
        priceStr += `<a href="https://itemdb.com.br/item/${item.slug}?utm_content=sdbPricer" target="_blank">???</a>`;
      }

      if(item.price.value){
        priceStr += `<div>`;

        if(item.saleStatus && item.saleStatus.status !== 'regular') {
            var color2 = item.saleStatus.status === 'ets' ? 'green' : '#fb1717';
            priceStr += `<small style='color:${color2}'><b>[${item.saleStatus.status.toUpperCase()}]</b></small> `;
        }

        priceStr += `<a href="https://itemdb.com.br/item/${item.slug}?utm_content=sdbPricer" target="_blank">${item.price.inflated ? "⚠ " : ""}${intl.format(item.price.value)} NP</a>`;
        priceStr += `</div>`;

        let grandTotal = 0;
        const totalValue = item.price.value * itemQty;
        grandTotal += totalValue

        if (itemQty > 1){
            priceStr += `<small style='color: #000000'><b>(${intl.format(totalValue)} NP total)</b></small> `
        }
      }

      if (item.isMissingInfo){
        priceStr += `<div><small><a href="https://itemdb.com.br/contribute?utm_content=sdbPricer" target="_blank"><i>We need info about this item<br/>Learn how to Help</i></a></small></div>`
      }
    } catch(e) { // We're not catching any specific error, as any error that may surface it will be handled with the "We need more info" referral link.
      console.error(e)
      priceStr += `<a>Not Found</a>`;
      priceStr += `<br/><small><a href="https://itemdb.com.br/contribute?utm_content=sdbPricer" target="_blank"><i>We need info about this item<br/>Learn how to Help</i></a></small>`
    }

    priceStr += '</div>';
    return priceStr;
}

const pricePage = (itemData) => {
  if(URLHas('/safetydeposit')) priceSDB(itemData);
  // if(URLHas('/closet')) priceCloset(itemData);
}

function priceSDB(itemData) {
  const table = $('.sdb-table');

  table.find('tr').slice(1).each(function() {
    const item_id = $(this).find('.sdb-item-img-wrap input').attr('id')?.match(/\d+/)?.at(0);

    const item = itemData[item_id];
    if(!item) return;
    
    const qty = itemInfo[item_id].amount || 1;

    const priceStr = getPriceStr(item, qty);

    $(this).find('.sdb-item-info').append(`${priceStr}`);
  })
}

function setColor(rarity) {
  if (rarity <= 74) return 'black';
  if(rarity <= 100) return '#089d08';
  if(rarity <= 104) return '#d16778'; // Special
  if(rarity <= 110) return 'orange';  // MEGA RARE
  if(rarity <= 179) return '#fb4444'; // Retired
  if(rarity == 180) return '#a1a1a1'; // Retired
  if(rarity <= 250) return '#fb4444'; // Hidden Tower
  return '#ec69ff';                   // Neocash | Artifact - 500
}

function registerFetchWatcher({ match, eventName }) {
  const targetWindow = unsafeWindow ?? window;

  if (!targetWindow.__idbFetchWatchers) {
    targetWindow.__idbFetchWatchers = [];
  }

  if (!targetWindow.__idbFetchPatched) {
    targetWindow.__idbFetchPatched = true;

    const originalFetch = targetWindow.fetch;

    targetWindow.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();

      let responseText = '';
      try {
        responseText = await clonedResponse.text();
      } catch {
        return response;
      }

      let requestData;
      try {
        requestData = JSON.parse(responseText);
      } catch {
        return response;
      }

      for (const watcher of targetWindow.__idbFetchWatchers) {
        try {
          if (watcher.match({ args, requestData, response })) {
            document.dispatchEvent(
              new CustomEvent(watcher.eventName, { detail: requestData })
            );
          }
        } catch {}
      }

      return response;
    };
  }
  console.log('Registering fetch watcher for event:', eventName);
  targetWindow.__idbFetchWatchers.push({ match, eventName });
}

if(URLHas('/safetydeposit')) {
  watchSDBItems();
  registerFetchWatcher({
    eventName: 'idb:sdbPricer:safetyDeposit',
    match: ({ requestData }) => typeof requestData.data.items !== 'undefined',
  });
}

