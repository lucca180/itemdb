  // ==UserScript==
  // @name         itemdb - Safety Deposit Box Pricer
  // @version      2.0.1
  // @author       itemdb
  // @namespace    itemdb
  // @description  Shows the market price for your sdb
  // @website      https://itemdb.com.br
  // @match        *://*.itemdb.com.br/*
  // @match        *://*.neopets.com/safetydeposit.phtml*
  // @require      https://itemdb.com.br/js/script-utils.js?v2
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
    // if you're reading this to create your own userscript,
    // don't use v2 endpoint yet, it is still in development and its not ready for general use.
    url: 'https://itemdb.com.br/api/v2/items/many',
    headers: {
      'Content-Type': 'application/json'
    },
    data: JSON.stringify({
      intent: 'pricer',
      type: 'item_id',
      data: IDs
    }),
    onerror: function(res) {
        console.error('[itemdb] Failed to fetch price data', res);
        handleError(res);
    },
    onload: function (res) {
      if (res.status === 200) {
        const itemData = JSON.parse(res.responseText);
        console.log(itemData);
        pricePage(itemData);
      }

      else {
        console.error('[itemdb] Failed to fetch price data', res);
        handleError(res);
      }
    }
  });
}

async function watchSDBItems() {
  document.addEventListener('idb:sdbPricer:safetyDeposit', function(e) {
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

      const linkUrl = `https://itemdb.com.br/item/${item.slug}?utm_content=sdbPricer`;

      if(item.status === 'no trade'){
        priceStr += `<a href="${linkUrl}" target="_blank">No Trade</a>`;
      }

      if(item.status === 'active') {
        if(item.type === 'nc') {
          // price for NC items is now only the active NC Mall price (or null).
          // The secondary-market trade value lives in its own field: item.ncValue.
          const ncMall = item.price?.type === "ncMall" ? item.price : null;
          const ncValue = item.ncValue;

          if(ncMall){
            priceStr += `<a href="${linkUrl}" target="_blank">Buyable</a>`;
          }

          else if(ncValue){
            priceStr += `<a href="${linkUrl}" target="_blank">${ncValue.range} caps</a>`;
          }

          else {
            priceStr += `<a href="${linkUrl}" target="_blank">NC</a>`;
          }
        }

        if(item.type === 'np' && !item.price.value){
          priceStr += `<a href="${linkUrl}" target="_blank">???</a>`;
        }

        if(item.type === 'np' && item.price.value){
          priceStr += `<div>`;

          if(item.saleStatus && item.saleStatus.status !== 'regular') {
              var color2 = item.saleStatus.status === 'ets' ? 'green' : '#fb1717';
              priceStr += `<small style='color:${color2}'><b>[${item.saleStatus.status.toUpperCase()}]</b></small> `;
          }

          const isInflated = item.price.flags?.includes('inflation');

          priceStr += `<a href="${linkUrl}" target="_blank">${isInflated ? "⚠ " : ""}${intl.format(item.price.value)} NP</a>`;
          priceStr += `</div>`;

          let grandTotal = 0;
          const totalValue = item.price.value * itemQty;
          grandTotal += totalValue

          if (itemQty > 1){
              priceStr += `<small style='color: #000000'><b>(${intl.format(totalValue)} NP total)</b></small> `
          }
        }
      }

      if (item.flags?.includes('missingInfo')){
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

function handleError(res) {
  const msg = idb_getApiErrorMessage(res, {
    html: true,
    fallback: 'Something went wrong. Please try again.',
  });

  const errorBox = $(`<div class="idb-api-error-box" style="font-size: small;text-align: center;color: red;margin: 10px 0;">itemdb SDB Pricer<br/>${msg}</div>`);
  $('.sdb-header-bar').before(errorBox);
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

if(URLHas('/safetydeposit')) {
  watchSDBItems();
  idb_registerFetchWatcher({
    eventName: 'idb:sdbPricer:safetyDeposit',
    match: ({ requestData }) => typeof requestData.data.items !== 'undefined',
  });
}

