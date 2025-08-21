// ==UserScript==
// @name         itemdb - Item Data Extractor
// @version      1.9.5
// @author       itemdb
// @namespace    itemdb
// @description  Feeds itemdb.com.br with neopets item data
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/*
// @match        *://*.itemdb.com.br/*
// @exclude      *://*.neopets.com/login/*
// @exclude      *://*.nc.neopets.com/*
// @exclude      *://*images.neopets.com/*
// @icon         https://itemdb.com.br/favicon.ico
// @require      https://raw.githubusercontent.com/lucca180/itemdb/cefb1bf6f9a9797ba7934e45c64d97ac27fbb1fe/userscripts/hash.min.js#sha256-qvScLSSeFxxVSGjWWNbTgwuqM2IffRSeYkXbGffQNzA=
// @connect      itemdb.com.br
// @connect      neopets.com
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @run-at       document-start
// @noframes
// ==/UserScript==

/* 
We are loading an external script (@require) that is only used to generate the cryptographic hash 
that ensures that the data sent to the server has not been altered.

This external script is accompanied by a SHA256 key. If any changes occur in this file, 
its key will change, and if this userscript is not updated with the new key, 
tampermonkey will not load the external script.

This ensures that no one will modify this external script without your knowledge.

The code of the external script has been obfuscated to prevent malicious actors from 
replicating the hash and inserting false information into the itemdb.
*/

// function to check if the current url contains a word
function URLHas(string) {
  return window.location.href.includes(string);
}

const originalOpen = window.XMLHttpRequest.prototype.open;
const originalFetch = window.fetch;

let resItemData = [];

const script_info = {
  version: GM_info.script.version,
  versionCode: Number(GM_info.script.version.replaceAll(".", ""))
}

const itemdb_script = function() {
  if(typeof $ === 'undefined') return;
  // Check if we are on the beta site
  const isBeta = !!$('#container__2020').length;

  // Some variables we will need later
  const hasSSW = !!($('#ssw__2020').length || $('#sswmenu').length);
  let itemsObj = {};
  let priceList = [];
  let tradeList = [];

  // Loads some history so we can check if we already sended the info to the server
  let itemsHistory = JSON.parse(localStorage?.getItem('idb_newItemHistory')) ?? {};
  let restockHistory = JSON.parse(localStorage?.getItem('idb_restockHistory')) ?? {};
  let tradeHistory = JSON.parse(localStorage?.getItem('idb_tradeHistory')) ?? {};
  let prevInventory = GM_getValue('prevInventory', {});

  // check the page language
  if(nl) {
    GM_setValue('pageLang', nl);
  }

  if (URLHas('idb_clear')) {
    localStorage.removeItem('idb_itemHistory');
    localStorage.removeItem('idb_restockHistory');
    localStorage.removeItem('idb_tradeHistory');
    GM_deleteValue("prevInventory");

    itemsHistory = {};
    restockHistory = {};
    tradeHistory = {};
    prevInventory = {};
  }

  // this is used to convert shop ids to item categories
  const shopIDToCategory={'1':'food','2':'magic item','3':'toy','4':'clothes','5':'grooming','7':'book','8':'collectable card','9':'battle magic','10':'defence magic','12':'gardening','13':'medicine','14':'candy','15':'baked','16':'healthy food','17':'gift','18':'smoothie','20':'tropical food','21':'island merchandise','22':'space food','23':'space battle','24':'space defence','25':'petpet','26':'robot petpet','27':'aquatic petpet','30':'spooky food','31':'spooky petpet','34':'coffee','35':'slushie','36':'ice crystal','37':'snow food','38':'faerie book','39':'faerie food','40':'faerie petpet','41':'furniture','42':'tyrannian food','43':'tyrannian furniture','44':'tyrannian petpet','45':'tyrannian weaponry','46':'hot dog','47':'pizza','48':'usuki doll','49':'desert food','50':'desert petpet','51':'desert scroll','53':'school','54':'desert weapon','55':'desert pottery','56':'medieval food','57':'medieval petpet','58':'stamp','59':'haunted weaponry','60':'spooky furniture','61':'wintery petpet','62':'jelly food','63':'refreshments','66':'kiko lake food','67':'kiko lake carpentry','68':'collectibles','69':'petpet supplies','70':'booktastic book','71':'kreludan furniture','72':'kreludan food','73':'meridell potion','74':'darigan toy','75':'faerie furniture','76':'roo island merchandise','77':'brightvale books','78':'brightvale scroll','79':'brightvale windows','80':'brightvale armour','81':'brightvale fruit','82':'brightvale motes','83':'brightvale potions','84':'instrument','85':'medical cures','86':'sea shells','87':'maractite weaponry','88':'maraquan petpets','89':'geraptiku petpet','90':'qasalan food','91':'qasalan weaponry','92':'qasalan tablets','93':'faerie weapon shop','94':'altadorian armour','95':'altadorian food','96':'altadorian magic','97':'altadorian petpets','98':'plushies','100':'wonderous weaponry','101':'exotic foods','102':'remarkable restoratives','103':'fanciful fauna','104':'neovian antiques','105':'neovian pastries','106':'neovian press','107':'neovian attire','108':'mystical surroundings','110':"lampwyck's lights fantastic",'111':"cog's togs",'112':'molten morsels','113':'moltaran petpets','114':'moltaran books','116':'springy things','117':'ugga shinies',};

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
            estVal: itemEl.dataset.itemvalue.split(' ')[0]?.replaceAll(',', ''),
            rarity: itemEl.dataset.rarity,
            category: itemEl.dataset.itemtype,
            img: itemEl.dataset.image,
            type: itemEl.dataset.itemset,
            weight: itemEl.dataset.itemweight,
            subText: itemSubEl.text(),
          };

          const itemKey = genItemKey(item);
          if (!itemsHistory[itemKey]) {
            itemsObj[itemKey] = item;
            itemsHistory[itemKey] = true;
          }
        });

        submitItems();
      });
    }
  }

  function handleSDB() {
    const allTrs = $('form table').eq(2).find('tr').clone();

    // SDB page can have lots of other scripts changing stuff
    // we're validating if the headers we care about are still there
    const validateSDB = ["Image", "Name", "Description", "Type"];
    
    let isValid = true;
    allTrs.first().find('td').map(function (i) {
      const text = $(this).text().trim();
      if (validateSDB[i] && validateSDB[i].toLowerCase() !== text.toLowerCase()) {
        isValid = false;
      }
    });

    console.log('[itemdb]: Valid SDB headers?', isValid);
    if (!isValid) return;
    

    allTrs.slice(1, -1).each(function (i) {
      const tds = $(this).find('td');
      const img = tds.first().find('img').first().attr('src');

      const itemName = tds.eq(1).find('b').first().clone().children().remove().end().text();

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
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
  }

  function handleTrades() {
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
          const rarityStr = $(this).find('td').eq(1).text().match(/(?:- r|rarity |artifact - )(\d+)/gi)?.[0]
          const rarity = rarityStr ? rarityStr.match(/\d+/)[0] : undefined;

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
          if (!itemsHistory[itemKey]) {
            itemsObj[itemKey] = item;
            itemsHistory[itemKey] = true;
          }
        });

      tradeList.push(trade);
    });

    submitItems();
    submitTrades();
  }

  function handleMyShop() {
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
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
  }

  function handleGeneralShops() {
    const shopID = window.location.href.match(/(?<=obj_type\=)\d+/)?.[0];
    const items = $('.shop-item');

    items.each(function (i) {
      const itemData = $(this).find('.item-img, .item-obelisk');
      const itemEl = itemData[0];
      const itemID = itemEl.dataset.link.match(/(?<=obj_info_id\=)\d+/)?.[0];

      const item = {
        name: itemEl.dataset.name,
        description: itemData.attr('title'),
        category: shopID ? shopIDToCategory[shopID] : undefined,
        img: itemData.css('background-image').replace(/^url\(['"](.+)['"]\)/, '$1'),
        itemId: itemID,
      };

      const itemKey = genItemKey(item);
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
  }

  function handleUserShops() {
    const allTds = $('.content table td');

    allTds.each(function (i) {
      const link = $(this).find('a').first().attr('href');
      if (!link || !link.includes('buy_item.phtml')) return;

      const itemID = link.match(/(?<=obj_info_id\=)\d+/)?.[0];
      const itemName = $(this).find('b').first().text();
      const img = $(this).find('img').attr('src');
      const description = $(this).find('img').attr('title');
      const price = link.match(/(?<=old_price\=)\d+/)?.[0];
      const owner = link.match(/(?<=owner\=)[^=&]+/gi)?.[0];
      const stock = $(this)
        .text()
        .match(/(\d+)(?= in stock)/gm)?.[0];

      const item = {
        name: itemName,
        img: img,
        description: description,
        itemId: itemID,
      };

      const itemKey = genItemKey(item);
      // has the exact info as items in general shop
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }

      const itemPriceInfo = {
        item_id: itemID,
        name: itemName,
        value: price,
        owner: owner.slice(0, 3).padEnd(6, '*'),
        stock: stock,
        type: 'usershop',
      };

      priceList.push(itemPriceInfo);
    });

    submitPrices();
    submitItems();
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
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
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
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
  }

  function handleCloset() {
    const trs = $('form table').eq(2).find('tr').slice(1, -1);

    trs.each(function (i) {
      const tds = $(this).find('td');
      const img = tds.first().find('img').first().attr('src');

      let itemName = tds.eq(1).find('b').first().clone().children().remove().end().text();
      if(!itemName) itemName = tds.eq(1).clone().children().remove().end().text();
      let subText = tds.eq(1).find('.medText').text();
      const description = tds.eq(2).text().trim();
      const category = tds.eq(3).text();
      let itemId = tds.last().find('input').attr('name').match(/\d+/)?.[0];

      let type;

      if(!itemId) {
        itemId = tds.last().find('.delete_pb')[0].dataset.item_id;
        type = 'pb';
      }

      const item = {
        name: itemName,
        img: img,
        description: description,
        rarity: type === 'pb' ? 101 : undefined,
        weight: type === 'pb' ? 1 : undefined,
        estVal: type === 'pb' ? 0 : undefined,
        subText: subText + " (wearable) ",
        category: category,
        itemId: itemId,
        type: type,
      };

      const itemKey = genItemKey(item);
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
  }

  function handleSearch() {
    const itemInfo = $('.search-iteminfo');
    let img = itemInfo.find('img').attr('src');
    const name = itemInfo.find('.search-item-name strong').text();
    const weight = itemInfo.find('.search-item-weight strong').text().match(/\d+/)?.[0];
    const rarity = itemInfo.find('.search-item-rarity strong').text().match(/\d+/)?.[0];
    const estVal = itemInfo.find('.search-item-value strong').text().match(/\d+/)?.[0];
    const description = itemInfo.find('.search-item-desc').text().trim();

    const restockShop = $('.search-buttongrid form input[name="obj_type"]').val();

    if(!img.includes('images.neopets.com/items'))
      img = null;

    const item = {
      name: name,
      img: img,
      description: description,
      rarity: rarity,
      weight: weight,
      estVal: estVal,
      category: shopIDToCategory[restockShop]
    }

    const itemKey = genItemKey(item);
    
    if (!itemsHistory[itemKey]) {
      itemsObj[itemKey] = item;
      itemsHistory[itemKey] = true;
    }

    submitItems();
  }

  function handleStorageShed() {
    const trs = $('form table').eq(1).find('tr').slice(1, -1);

    trs.each(function (i) {
      const tds = $(this).find('td');
      const img = tds.first().find('img').first().attr('src');

      let itemName = tds.eq(1).find('strong').first().clone().children().remove().end().text();
      let subText = tds.eq(1).find('.medText').text();
      const description = tds.eq(2).text().trim();
      const category = tds.eq(3).text();
      let itemId = tds.last().find('input').attr('name').match(/\d+/)?.[0];

      const item = {
        name: itemName,
        img: img,
        description: description,
        subText: subText + " (neohome) ",
        category: category,
        itemId: itemId,
      };

      const itemKey = genItemKey(item);
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    });

    submitItems();
  }

  function handleNCMall() {
    window.addEventListener('hashchange', () => {
      const filteredItems = desc_arr.filter(n => n);
      for(const itemData of filteredItems){
        let subText = ''
        if(itemData.isWearable) subText += ' (wearable) '
        if(itemData.isNeohome) subText += ' (neohome) '

        const item = {
          itemId: itemData.id,
          name: itemData.name,
          subText: subText,
          img: `https://images.neopets.com/items/${itemData.imageFile}.gif`,
          description: itemData.description,
          type: 'nc',
        }

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = true;
        }
      }

      submitItems();
    })
  }

  function handleNCJournal(){
    const items = $(".content table td");
    items.each(function (i) {
      const img = $(this).find('img').attr('src');
      if(!img) return;

      const div = $(this).find('div > div');
      if(!div.length) return;
      const itemID = div.attr("id").split("item_div_")[1];
      const name = div.find('b').first().text();

      const item = {
        name: name,
        img: img,
        itemId: itemID,
        type: 'nc',
      };

      const itemKey = genItemKey(item);
      if (!itemsHistory[itemKey]) {
        itemsObj[itemKey] = item;
        itemsHistory[itemKey] = true;
      }
    })

    submitItems();
  }

  async function handleCustomization () {
    const handleData = (petdata) => {
      const itemsRawData = petdata.editordata.object_info_registry;
      const pbitems = petdata.pbitems;

      for(const itemData of Object.values(itemsRawData)){
        let subText = '(wearable)';
        let type = itemData.is_paid ? 'nc' : undefined;

        if(!type) 
          type = pbitems.includes(itemData.obj_info_id.toString()) ? 'pb' : 'np';
        
        const item = {
          name: itemData.name,
          description: itemData.description,
          subText: subText,
          img: itemData.thumbnail_url,
          itemId: itemData.obj_info_id,
          estVal: itemData.price,
          rarity: itemData.rarity_index,
          category: itemData.type,
          type: type,
          weight: itemData.weight_lbs,
        }

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = true;
        }
      }

      submitItems();
    }

    setInterval(() => {
      if(resItemData) resItemData.map(x => handleData(x));
      resItemData = [];      
    }, 1000);
  }

  async function handlePetLookup() {
    const handleData = (customData) => {
      const itemsRawData = customData.viewdata.object_info_registry;
      for(const itemData of Object.values(itemsRawData)){
        let subText = '(wearable)';
        let type = itemData.is_paid ? 'nc' : undefined;
        
        const item = {
          name: itemData.name,
          description: itemData.description,
          subText: subText,
          img: itemData.thumbnail_url,
          itemId: itemData.obj_info_id,
          estVal: itemData.price,
          rarity: itemData.rarity_index,
          category: itemData.type,
          type: type,
          weight: itemData.weight_lbs,
        }
    
        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = true;
        }
      }

      submitItems();
    }

    setInterval(() => {
      if(resItemData) resItemData.map(x => handleData(x));
      resItemData = [];
    }, 1000);
  }

  async function handleUCChamber() {
    const handleData = (customData) => {
      const styles = customData.userStyles.closet_items ?? {};

      // NC UC DATA
      for(const rawItem of Object.values(styles)){
        const itemData = rawItem.object_info;
        
        let subText = '(wearable)';
        let type = itemData.obj_rarity === "500" ? 'nc' : undefined;
        
        const item = {
          name: itemData.obj_name,
          description: itemData.obj_desc,
          subText: subText,
          img: 'https://images.neopets.com/items/'+itemData.obj_filename,
          itemId: itemData.obj_info_id,
          estVal: itemData.obj_price,
          rarity: itemData.obj_rarity,
          category: 'Special', // assuming all are special
          type: type,
          weight: itemData.obj_weight_lbs,
        }

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = true;
        }
      }

      // other items
      const itemsRawData = customData.petView.object_info_registry;
      for(const itemData of Object.values(itemsRawData)){
        let subText = '(wearable)';
        let type = itemData.is_paid ? 'nc' : undefined;
        
        const item = {
          name: itemData.name,
          description: itemData.description,
          subText: subText,
          img: itemData.thumbnail_url,
          itemId: itemData.obj_info_id,
          estVal: itemData.price,
          rarity: itemData.rarity_index,
          category: itemData.type,
          type: type,
          weight: itemData.weight_lbs,
        }

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = true;
        }
      }

      submitItems();
    }

   setInterval(() => {
      if(resItemData) resItemData.map(x => handleData(x));
      resItemData = [];
    }, 1000);
  }

  // ------ itembd (battledome) ------ //

  function handleBDEquip() {  
    const handleData = (items) => {
      for(const itemData of items){
        const item = {
          name: itemData.name,
          img: itemData.imageUrl,
          itemId: Number(itemData.oii),
          isBD: true
        }

        const itemKey = genItemKey(item);
        if (!itemsHistory[itemKey]) {
          itemsObj[itemKey] = item;
          itemsHistory[itemKey] = true;
        }
      }

      submitItems();
    }

    const items = BDStatus.objInfo;
    if(items) handleData(items);

    $(document).ajaxSuccess(() => {
      const items = BDStatus.objInfo;
      if(items) handleData(items);
    });
  }

  // ------ prices ------ //

  function handleSWPrices() {
    $(document).ajaxSuccess(() => {
      const itemName = $('.wizard-results-text h3').text();
      const items = $('.wizard-results-grid-shop li').clone().slice(1);
      const minVal = $('input[name="rs_min_price"]').val();

      if(minVal > 1) return;

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
      });

      submitPrices();
    });
  }

  function handleSSWPrices() {
    $(document).ajaxSuccess(() => {
      const resultTrs = isBeta
        ? $('.ssw-results-grid li').slice(1)
        : $('#ssw-tabs-2 #results_table tr').slice(1);
      if (resultTrs.length === 0) return;

      const minVal = $(':input[name="min_price"]').val()

      if(minVal > 1) return;

      const itemName = $('#search_for')
        .text()
        .match(/'(.*?)'/gm)?.[1];

      if (isBeta) {
        resultTrs.each(function (i) {
          const shopOwner = $(this).find('div').eq(0).text();
          const itemID = $(this)
            .find('div a')
            .eq(0)
            .attr('href')
            .match(/(?<=obj_info_id\=)\d+/)?.[0];
          const price = $(this)
            .find('div a')
            .eq(0)
            .attr('href')
            .match(/(?<=buy_cost_neopoints\=)\d+/)?.[0];
          const stock = $(this).find('div').eq(1).text();

          const itemPriceInfo = {
            item_id: itemID,
            name: itemName.slice(1, -1),
            owner: shopOwner.slice(0, 3).padEnd(6, '*'),
            stock: parseInt(stock),
            value: parseInt(price),
            type: 'ssw',
          };

          priceList.push(itemPriceInfo);
        });
      } else {
        resultTrs.each(function (i) {
          const shopOwner = $(this).find('td').eq(0).text();
          const itemID = $(this)
            .find('td a')
            .eq(0)
            .attr('href')
            .match(/(?<=obj_info_id\=)\d+/)?.[0];
          const price = $(this)
            .find('td a')
            .eq(0)
            .attr('href')
            .match(/(?<=buy_cost_neopoints\=)\d+/)?.[0];
          const stock = $(this).find('td').eq(1).text();

          const itemPriceInfo = {
            item_id: itemID,
            name: itemName.slice(1, -1),
            owner: shopOwner.slice(0, 3).padEnd(6, '*'),
            stock: parseInt(stock),
            value: parseInt(price),
            type: 'ssw',
          };

          priceList.push(itemPriceInfo);
        });
      }

      submitPrices();
    });
  }

  function handleAuctionPrices() {
    let auctions;

    if (URLHas('genie.phtml')) auctions = $('.content > p > table tr').clone().slice(1);

    if (URLHas('auctions.phtml')) auctions = $('.content > center table tr').clone().slice(1);

    auctions.each(function (i) {  
      const tds = $(this).find('td');
      const auction_id = tds
        .eq(1)
        .find('a')
        .attr('href')
        .match(/(?<=auction_id\=)\d+/)?.[0];
      const img = tds.eq(1).find('img').attr('src');
      const itemName = tds.eq(2).find('a').first().text();
      const owner = tds.eq(3).find('.sf').text();
      const isNF = tds.eq(3).find('b')?.text() ? 'NF' : '';
      const timeLeft = tds.eq(4).find('b').text();
      const lastBid = tds.eq(5).find('b').text().replaceAll(/(\,|\.)/g, '');
      const askingPrice = tds.eq(6).find("b").text().replaceAll(/(\,|\.)/g, '');

      let bidder = tds.eq(-1).text().trim();

      bidder = bidder === "nobody" ? bidder : bidder.slice(0, 3).padEnd(6, "*");
      const hasBuyer = bidder !== "nobody";

      const otherInfo = [isNF, timeLeft, bidder];

      const itemPriceInfo = {
        name: itemName,
        img: img,
        owner: owner.slice(0, 3).padEnd(6, "*"),
        stock: 1,
        value: parseInt(hasBuyer ? lastBid : askingPrice),
        otherInfo: otherInfo,
        type: "auction",
        neo_id: auction_id,
      };
      
      priceList.push(itemPriceInfo);
    });

    submitPrices();
  }

  function handleRestock() {
    const items = $('.shop-item');

    items.each(function (i) {
      const info = $(this).find('.item-img, .item-obelisk')[0];
      const itemName = info.dataset.name;
      const price = info.dataset.price.replace(',', '');
      const id = info.dataset.link.match(/(?<=obj_info_id\=)\d+/)?.[0];
      const stock = $(this).find('.item-stock').first().text().match(/\d+/)?.[0];
      const stockId = info.dataset.link.match(/(?<=stock_id\=)\d+/)?.[0];
      
      const today = new Date().getDate();

      if (restockHistory[id] === stockId+today) return;

      restockHistory[id] = stockId+today;

      const itemInfo = {
        item_id: id,
        name: itemName,
        owner: 'restock',
        stock: parseInt(stock),
        value: parseInt(price),
        type: 'restock',
        neo_id: stockId,
      };

      priceList.push(itemInfo);
    });

    submitPrices();
  }

  function handleRestockHaggle(){
    const itemName = $('#container__2020 > h2').first().text().match(/(?<=Haggle for ).+/)?.[0];
    const url = window.location.href;
    const id = url.match(/(?<=obj_info_id\=)\d+/)?.[0];
    const stockId = url.match(/(?<=stock_id\=)\d+/)?.[0];
    const hours = new Date().getHours();

    if (restockHistory[id] === stockId+hours) return;

    // we can get better data from the shop page
    // restockHistory[id] = stockId+hours;

    const itemInfo = {
      item_id: id,
      name: itemName,
      owner: 'restock-haggle',
      stock: 1,
      value: 1,
      type: 'restock',
      neo_id: stockId,
    };

    priceList.push(itemInfo);

    submitPrices();
  }

  // ------ openables ------ //

  function handleNCCapsule(){
    $(document).on('ajaxSuccess.gashapon', () => {
      const isGacha = !!$('#iteminfo_select_action option[value="gashapon"]').length;
      if(!isGacha) return;

      const itemName = $("#invItemName").text();
      const image = $("#invItemImg").css("background-image").replace(/^url\(['"](.+)['"]\)/, '$1')
      
      const parentItem = {
        name: itemName,
        img: image
      }
      const submitButton = $('#iteminfo_select_action > div');
      if(!submitButton.length) return;

      let note = '';

      $(document).off(`ajaxSuccess.gashapon`);
      
      const JQUERY3 = jQuery;
      const J$ = $;
      let _interval;
      submitButton.on(`click.action`, function(){
        const selectedAction = $('#iteminfo_select_action select').find(":selected").val();
        if(selectedAction !== "gashapon") return;

        submitButton.off(`click.action`);

        $(document).on(`ajaxSuccess.actionSuccess`, () => {
          const results = $('.gashapon_display');

          // neopets changes the jquery object and breaks everything.
          if(_interval) clearInterval(_interval);
          _interval = setInterval(() => {$ = J$; jQuery = JQUERY3;}, 100);

          if(!results.length) return;

          if(typeof selected !== 'undefined') 
            note = note || selected.toString()

          const items = [];

          results.find("img").each(function (i) {
            const parent = $(this).parent()
            const name = parent.find('b').first().text();
            const imgsrc = $(this).attr('src');

            const isLE = $(this).css('border-width') !== '0px';

            items.push({
              name: name,
              img: imgsrc,
              isLE: isLE,
              notes: note
            })
          })

          if(!items.length) return;
          $(document).off(`ajaxSuccess.actionSuccess`);
          submitOpenable(items, parentItem)
        })
      })
    });
  }

  function handleNCGram() {
    $(document).on('ajaxSuccess.ncGram', () => {
      const popupTitle = $(".popup-body__2020 input[name='popup_title']");
      if(!popupTitle.length) return;

      const itemName = $("#invItemName").text();
      const isGram = popupTitle.val()?.toLowerCase().split(" ").includes("gram") || itemName?.toLowerCase().split(" ").includes("gram");

      if(!isGram) return;
      const image = $(".inv-itemLg").css("background-image").replace(/^url\(['"](.+)['"]\)/, '$1')
      
      const parentItem = {
        name: itemName,
        img: image
      }
      
      const gramOptions = $("#giftItem-1 option").map(function() {
        if($(this).val() < 0) return;
        return $(this).text()
      }).get();

      const gramInfo = {
        options: gramOptions,
        cash_id: $(".popup-body__2020 input[name='cash_obj_id']").val()
      }

      const submitButton = $('#iteminfo_select_action > div');
      if(!submitButton.length) return;
      
      $(document).off(`ajaxSuccess.ncGram`);
      
      const JQUERY3 = jQuery;
      const J$ = $;
      let _interval;
      submitButton.on(`click.action`, function(){
        submitButton.off(`click.action`);

        $(document).on(`ajaxSuccess.actionSuccess`, () => {
          const result = $('#invResult');

          // neopets changes the jquery object and breaks everything.
          if(_interval) clearInterval(_interval);
          _interval = setInterval(() => {$ = J$; jQuery = JQUERY3;}, 100);

          if(!result.length) return;
          
          const item = {
            name: result.find('b').first().text(),
            img: result.find("img").attr('src'),
            isLE: false,
            notes: 'gram',
          };

          $(document).off(`ajaxSuccess.actionSuccess`);

          console.log([item], parentItem, gramInfo)
          submitOpenable([item], parentItem, gramInfo)
        })
      })
    });
  }

  function handleNPOpenables(){
    const pageLoad = Date.now();
    $(document).ajaxSuccess(() => {
      const isNP = $("#invDisplay")[0].dataset?.type === "np";
      
      if(!isNP) return;
      const selectInput = $('#iteminfo_select_action select');
      if(!selectInput.length) return;

      const itemName = $("#invItemName").text();
      const image = $("#invItemImg").css("background-image").replace(/^url\(['"](.+)['"]\)/, '$1')
      
      const parentItem = {
        name: itemName,
        img: image
      }

      const ignoreEvents = ["safetydeposit", "donate", "drop", "stockshop", "stockgallery", "give", "auction"];

      const submitButton = $('#iteminfo_select_action > div');

      submitButton.on("click", function(){
        if(Date.now() - pageLoad > 1.5*60*1000) return;

        const selectedAction = $('#iteminfo_select_action select').find(":selected").val();
        if(ignoreEvents.includes(selectedAction)) return;
        
        const allItems = {};
      
        $('.grid-item').each(function (i) {
          const itemEl = $(this).find('.item-img')[0];
          const item = {
            name: itemEl.dataset.itemname,
            img: itemEl.dataset.image,
            quantity: parseInt(itemEl.dataset.itemquantity),
          };

          const itemKey = genItemKey({name: item.name, img: item.img});
          if(allItems[itemKey]) allItems[itemKey].quantity += item.quantity;
          else allItems[itemKey] = item;
      });

        const inventoryOpenable = {
          allItems: allItems,
          parentItem: parentItem,
          now: Date.now()
        };

        GM_setValue('prevInventory', inventoryOpenable);
      });
    });
  }

  function handleNPRefresh(){
    $(document).ajaxSuccess(() => {
      if(Object.values(prevInventory).length === 0 || !prevInventory.parentItem) return;

      const isNP = $("#invDisplay")[0].dataset?.type === "np";
      if(!isNP) return;

      //check if time is more than 1 minute
      if(Date.now() - prevInventory.now > 1*60*1000) 
        return GM_deleteValue('prevInventory');

      const items = [];
      const sumItems = {};
      const grid = $('.grid-item');
      if(grid.length === 0) return;

      grid.each(function (i) {
        const itemEl = $(this).find('.item-img')[0];

        const item = {
          name: itemEl.dataset.itemname,
          img: itemEl.dataset.image,
          quantity: parseInt(itemEl.dataset.itemquantity),
        };

        const itemKey = genItemKey({name: item.name, img: item.img});
        if(sumItems[itemKey]) sumItems[itemKey].quantity += item.quantity;
        else sumItems[itemKey] = item;

        if(
          !prevInventory.allItems[itemKey] || 
          prevInventory.allItems[itemKey].quantity < item.quantity || 
          prevInventory.allItems[itemKey].quantity < sumItems[itemKey].quantity
        ){
          items.push({
            name: item.name,
            img: item.img,
            isLE: false
          });
        }
      });

      if(items.length !== 0)
        submitOpenable(items, {...prevInventory.parentItem});
      
      GM_deleteValue('prevInventory');
      prevInventory = {};
    })
  }

  function discardPrevInventory(){
    // in case of a refesh that is not a inventory refresh
    // we need to discard the opening data

    return GM_deleteValue('prevInventory');
  }

  // ------------- //

  // Here we check if the page has the url we want and then call the respective function
  // and we also check if you have SSW so we can call the SSW handler

  if (URLHas('inventory')) {
    handleInventory();
    handleNCCapsule();
    handleNPOpenables();
    handleNPRefresh();
    handleNCGram();
  }
  if (!URLHas('inventory')) discardPrevInventory();
  if (URLHas('safetydeposit')) handleSDB();
  if (URLHas('closet.phtml')) handleCloset();
  if (URLHas('trading')) handleTrades();
  if (URLHas('market')) handleMyShop();
  if (URLHas('obj_type')) handleGeneralShops();
  if (URLHas('obj_type')) handleRestock();
  if (URLHas('browseshop.phtml')) handleUserShops();
  if (URLHas('wizard.phtml')) handleSWPrices();
  if (URLHas('genie.phtml') || URLHas('auctions.phtml')) handleAuctionPrices();
  if (URLHas('gallery/index.phtml')) handleGallery();
  if (URLHas('gallery/quickremove.phtml') || URLHas('gallery/quickcat.phtml')) handleGalleryAdmin();
  if (URLHas('search.phtml') && URLHas('selected_type=object')) handleSearch();
  if (URLHas('neohome/shed')) handleStorageShed();
  if (URLHas('/mall/shop.phtml')) handleNCMall();
  if (URLHas('customise')) handleCustomization();
  if (URLHas('haggle.phtml')) handleRestockHaggle();
  if (URLHas('/ncma/')) handleNCJournal();
  if (URLHas('petlookup.phtml')) handlePetLookup();
  if (URLHas('/stylingchamber/')) handleUCChamber();
  if (URLHas('dome/neopets.phtml')) handleBDEquip();
  if (hasSSW) handleSSWPrices();

  // ----------- //

  // Here we send the data to the server
  // We send the items and prices separately because the items are sent only once
  // Again - no personal information is sent to the server. Only item data.

  async function submitItems() {
    if(checkTranslation()) return;
    const itemsList = Object.values(itemsObj);
    if (itemsList.length === 0) return;
    
    const hash = idb.getItemsHash(itemsObj);
    const pageLang = GM_getValue('pageLang', 'unknown');
    
    if(pageLang !== nl) return console.error('Language error');

    const rawData = {
      lang: pageLang,
      items: itemsList,
      hash: hash
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://itemdb.com.br/api/v1/items',
      headers: {
        'Content-Type': 'application/json',
        'itemdb-version': script_info.versionCode,
      },
      data: JSON.stringify(rawData),
      onload: function (res) {
        if (res.status === 200) {
          console.log(`[itemdb] ${itemsList.length} items data sent`);
          localStorage?.setItem('idb_newItemHistory', JSON.stringify(itemsHistory));
          itemsObj = {};
          idb.resetHash();
        } else {
          console.error('[itemdb] submitItems error:', res, rawData);
        }
      },
    })
  }

  async function submitPrices() {
    if(checkTranslation()) return;
    if (priceList.length === 0) return;

    const hash = idb.getPricesHash(priceList);
    
    const pageLang = GM_getValue('pageLang', 'unknown');
    const rawData = {
      lang: pageLang,
      itemPrices: priceList,
      hash: hash
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://itemdb.com.br/api/v1/prices',
      headers: {
        'Content-Type': 'application/json',
        'itemdb-version': script_info.versionCode,
      },
      data: JSON.stringify(rawData),
      onload: function (res) {
        if (res.status === 200) {
          console.log(`[itemdb] ${priceList.length} price data sent`);
          localStorage?.setItem('idb_restockHistory', JSON.stringify(restockHistory));
          priceList = [];
          idb.resetHash();
        } else {
          console.error('[itemdb] submitPrices error:', res, rawData);
        }
      },
    })
  }

  async function submitTrades() {
    if(checkTranslation()) return;
    if (tradeList.length === 0) return;

    const hash = idb.getTradesHash(tradeList);

    const pageLang = GM_getValue('pageLang', 'unknown');
    const rawData = {
      lang: pageLang,
      tradeLots: tradeList,
      hash: hash
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://itemdb.com.br/api/v1/trades',
      headers: {
        'Content-Type': 'application/json',
        'itemdb-version': script_info.versionCode,
      },
      data: JSON.stringify(rawData),
      onload: function (res) {
        if (res.status === 200) {
          console.log(`[itemdb] ${tradeList.length} trade data sent`);
          localStorage?.setItem('idb_tradeHistory', JSON.stringify(tradeHistory));
          tradeList = [];
          idb.resetHash();
        } else {
          console.error('[itemdb] submitTrades error:', res, rawData);
        }
      },
    })
  }

  async function submitOpenable(items, parentItem, gramInfo) {
    if(checkTranslation()) return;

    const hash = idb.getTradesHash({items, parentItem, gramInfo});

    const pageLang = GM_getValue('pageLang', 'unknown');
    if(pageLang !== nl) return console.error('Language error');

    const rawData = {
      lang: pageLang,
      items: items,
      parentItem: parentItem,
      gramInfo: gramInfo,
      hash: hash,
    }

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://itemdb.com.br/api/v1/items/open',
      headers: {
        'Content-Type': 'application/json',
        'itemdb-version': script_info.versionCode,
      },
      data: JSON.stringify(rawData),
      onload: function (res) {
        if (res.status === 200) {
          console.log(`[itemdb] ${parentItem.name} open result sent`);
        } else {
          console.error('[itemdb] openable result error:', res, rawData);
        }
      },
    })
  }

  // ----------- //

  // this function is used to detect if the page is translated using google translate or similar
  function checkTranslation() {
    return !!document.querySelector(
      "html.translated-ltr, html.translated-rtl, ya-tr-span, *[_msttexthash], *[x-bergamot-translated]"
    );
  }
}

// this function is used to generate a unique key for each item based on the information we got for it
function genItemKey(item) {
  return idb?.hashKey(item);
}

// only runs the script if the page is fully loaded
addEventListener("DOMContentLoaded", itemdb_script);

// For some pages, we need to watch if we receive the item data from the neo server
// We only watch requests that contains the data from items. Everything else is ignored.

function watchItemRequests(paramName){
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener("load", function() {
      if (this.response.includes("{")){
        const requestData = JSON.parse(this.response);
        // check if the request contains the item data we want, if not we ignore it
        if (typeof requestData[paramName] === 'undefined') return;
        resItemData.push(requestData);
      }
    })
   
    originalOpen.apply(this, arguments);
  }
}

function watchFetchItemRequests(paramName) {
  unsafeWindow.fetch = async (...args) => {
    const response = await originalFetch(...args);
    const clonedResponse = response.clone();
    const responseText = await clonedResponse.text();
    if (responseText.includes("{")) {
      try {
        const requestData = JSON.parse(responseText);
        // check if the request contains the item data we want, if not we ignore it
        if (typeof requestData[paramName] !== 'undefined') {
          resItemData.push(requestData);
        }
      } catch (error) {}
    }
    
    return response;
  };
}
// **ONLY** watch requests in these pages
if (URLHas('petlookup.phtml')) watchItemRequests('viewdata');
if (URLHas('/stylingchamber/')) watchFetchItemRequests('userStyles');
if (URLHas('customise')) watchItemRequests('editordata');

// for troubleshooting use
unsafeWindow.itemdb_script = script_info;