// ==UserScript==
// @name         itemdb - Price Checker & List Importer
// @version      2.0.0
// @author       itemdb
// @namespace    itemdb
// @description  Price check your items, filter, sort and import to your wishlists
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/closet.phtml*
// @match        *://*.neopets.com/safetydeposit.phtml*
// @match        *://*.neopets.com/gallery/quickremove.phtml*
// @match        *://*.neopets.com/stamps.phtml*
// @match        *://*.neopets.com/gourmet_club.phtml*
// @match        *://*.neopets.com/games/neodeck/index.phtml*
// @match        *://*.neopets.com/books_read.phtml*
// @match        *://*.neopets.com/moon/books_read.phtml*
// @match        *://*.neopets.com/quickstock.phtml*
// @match        *://*.neopets.com/market.phtml?type=your*
// @match       *://*.neopets.com/neohome/shed*
// @match        *://*.itemdb.com.br/*
// @icon         https://itemdb.com.br/favicon.ico
// @require      https://itemdb.com.br/js/script-utils.js?v2
// @grant        unsafeWindow
// @run-at       document-start
// @noframes
// ==/UserScript==

// itemdb troubleshooting - https://itemdb.com.br/tools/troubleshooting
const script_info = {
  version: GM_info.script.version,
  versionCode: Number(GM_info.script.version.replaceAll(".", ""))
}

if(typeof unsafeWindow !== "undefined") 
  unsafeWindow.itemdb_listImporter = script_info;
else window.itemdb_listImporter = script_info;

if(!window.location.href.includes("neopets.com")) return;

function URLHas(string) {
  return window.location.href.includes(string);
}

function getImageID(url){
  return url.split('/').pop().split('.')[0];
}

let item_list = {};

const itemdb_importer = function() {
  function createImportButton() {
    return $(`
      <button type="button" style="font-family: Verdana, Arial, sans-serif; font-size: 12px; padding: 5px;display: inline-flex;background: #2D3748;border-radius: 3px;justify-content: center;align-items: center;gap: 5px;color: white !important;border: none;cursor: pointer;">
        <img
          src="https://itemdb.com.br/logo_icon.svg"
          width="25px"
          height="auto"
        />
        Import or Price Check with itemdb
      </button>
    `);
  }

  function submitImport({ items, indexType, meta }) {
    const form = document.createElement('form');
    form.action = 'https://itemdb.com.br/api/v1/lists/import-session';
    form.method = 'POST';
    form.target = '_blank';
    form.style.display = 'none';

    const fields = {
      itemDataJson: JSON.stringify(items),
      indexType,
    };

    if (meta) {
      fields.meta = JSON.stringify(meta);
    }

    Object.entries(fields).forEach(([name, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = String(value ?? '');
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    form.remove();
  }

  function mountImportButton({ target, collector, withBreak = false, where = 'before' }) {
    const button = createImportButton();
    button.on('click', () => submitImport(collector()));

    const wrapper = $('<center></center>').append(button);
    target[where](wrapper);

    if(withBreak)
      wrapper.after('<br/>');

    console.log('itemdb List Importer: Button mounted');
  }

  // ---------- Handlers ---------- //

  function handleSDB(){
    return {
      items: collectSDBItems(),
      indexType: 'item_id',
    };
  }

  function handleGalleryRemovePage(){
    return {
      items: collectGalleryRemoveItems(),
      indexType: 'item_id',
    };
  }

  function handleCloset(){
    return {
      items: collectClosetItems(),
      indexType: 'item_id',
    };
  }

  function handleStamps(){
    let params = (new URL(document.location)).searchParams;
    let albumID = parseInt(params.get("page_id"), 10);

    return {
      items: collectStampItems(),
      indexType: 'image_id',
      meta: Number.isFinite(albumID) ? { albumID } : undefined,
    };
  }

  function handleGourmet(){
    return {
      items: collectImageItems($(".content p img")),
      indexType: 'image_id',
      meta: { list_id: 72 },
    };
  }

  function handleNeoDeck(){
    return {
      items: collectNeoDeckItems(),
      indexType: 'name',
      meta: { list_id: 248 },
    };
  }

  function handleBooks(){
    return {
      items: collectImageItems($(".content table img")),
      indexType: 'image_id',
      meta: { list_id: URLHas('moon') ? 663 : 664 },
    };
  }

  function collectSDBItems() {
    return item_list;
  }

  function collectGalleryRemoveItems() {
    const items = {};
    let itemsTrs = $('#quickremove_form tr').slice(1, -2);

    itemsTrs.each(function () {
      const itemId = $(this).find('div').first().attr('id');
      const quantity = $(this).find('input').last().val();

      items[itemId] = Number(quantity);
    });

    return items;
  }

  function collectClosetItems() {
    return item_list;
  }

  function collectStampItems() {
    const items = {};
    const tds = $(".content table td");

    tds.each(function () {
      const img = $(this).find('img');
      const src = img.attr('src') ?? '';
      if(!img.length || !src || !src.includes("images.neopets.com/items/")) return;

      const image_id = getImageID(img.attr('src'));
      const img_class = img.attr('class') ?? '';
      if(image_id === 'no_stamp' || img_class.includes('fake-stamp')) return;

      items[image_id] = 1;
    });

    return items;
  }

  function collectImageItems(images) {
    const items = {};

    images.each(function () {
      const image_id = getImageID($(this).attr('src'));
      items[image_id] = 1;
    });

    return items;
  }

  function collectNeoDeckItems() {
    const items = {};

    $(".content table table a b").each(function () {
      let name = $(this).text().trim();

      if(name === 'Meerouladen and Heermeedjet')
        name = 'Merouladen and Heermeedjet'; // the actual deck and the item name are different

      items[name] = 1;
    });

    return items;
  }

  function collectMyShopItems() {
    const items = {};
    $(".np-table-row").each(function () {
      const item_id = $(this).find('input[name*=obj_id]').val();
      const qty = $(this).find('.mkt-stepper').data('max') ?? 1;

      items[item_id] = qty;
    })

    return items;
  }

  function collectShed() {
    const items = {};
    const shedItems = $("td.content form[action*='move_to_inventory'] tr")
    shedItems.each(function (i) {
      if(i === 0 || i === shedItems.length - 1) return; // skip header and footer

      const item_id = $(this).find('input').eq(-1).attr('name');
      const qty = $(this).find('td').eq(-2).text().trim() || 1;

      items[item_id] = qty;
    })

    return items;
  }

  function canImportStamps() {
    return $('.content center').eq(-1).text().includes("You have");
  }

  function canImportNeoDeck() {
    return nl === 'en';
  }

  function handleQuickstock(){
    return {
      items: item_list,
      indexType: 'item_id',
    };
  }

  function handleMyShop(){
    return {
      items: collectMyShopItems(),
      indexType: 'item_id',
    };
  }

  function handleShed() {
    return {
      items: collectShed(),
      indexType: 'item_id',
    };
  }

  if (URLHas('safetydeposit'))
    mountImportButton({
      target: $('.sdb-header-bar'),
      collector: handleSDB,
      where: 'before',
      withBreak: true,
    });
  if (URLHas('gallery/quickremove.phtml'))
    mountImportButton({
      target: $('#quickremove_form'),
      collector: handleGalleryRemovePage,
      withBreak: true,
    });
  if (URLHas('closet.phtml'))
    mountImportButton({
      target: $(".closet-header"),
      collector: handleCloset,
      withBreak: true,
      where: 'after',
    });
  if (URLHas('stamps.phtml') && canImportStamps())
    mountImportButton({
      target: $(".content table"),
      collector: handleStamps,
    });
  if (URLHas('gourmet_club.phtml'))
    mountImportButton({
      target: $(".content center").eq(0),
      collector: handleGourmet,
      withBreak: true,
    });
  if (URLHas('neodeck/index.phtml') && canImportNeoDeck())
    mountImportButton({
      target: $(".content table").eq(0),
      collector: handleNeoDeck,
    });
  if (URLHas('books_read.phtml'))
    mountImportButton({
      target: URLHas('moon') ? $(".content table").eq(0) : $(".content > div").eq(0),
      collector: handleBooks,
      withBreak: true,
    });
  if (URLHas('quickstock.phtml'))
    mountImportButton({
      target: $('#qs-instructions'),
      collector: handleQuickstock,
      where: 'after',
      withBreak: true,
    });

  if (URLHas('market.phtml?type=your'))
    mountImportButton({
      target: $('.market-your-headerbar'),
      collector: handleMyShop,
      where: 'before',
      withBreak: true,
    });

  if (URLHas('neohome/shed'))
    mountImportButton({
      target: $("form[action*='move_to_inventory']"),
      collector: handleShed,
      where: 'before',
      withBreak: true,
    });
}

// only runs the script if the page is fully loaded
addEventListener("DOMContentLoaded", itemdb_importer);

const watchClosetChanges = () => {
  document.addEventListener('idb:importer:closet', (e) => {
    const itemList = e.detail.items;
    item_list = {};
    for (const item of itemList) {
      item_list[item.obj_info_id] = item.qty;
    }
  })
}

const watchSDBChanges = () => {
  document.addEventListener('idb:importer:sdb', (e) => {
    const itemList = e.detail.data.items;
    item_list = {};
    for (const item of itemList) {
      item_list[item.obj_info_id] = item.amount;
    }
  })
}
const watchQuickstockChanges = () => {
  document.addEventListener('idb:importer:quickstock', (e) => {
    const itemList = e.detail.items;
    item_list = {};
    for (const item of itemList) {
      item_list[item.oii] = item.count;
    }
  })
}

if (URLHas('/closet')) {
  idb_registerFetchWatcher({
    eventName: 'idb:importer:closet',
    match: ({ requestData }) => typeof requestData.items !== 'undefined',
  });

  watchClosetChanges();
}

if (URLHas('/safetydeposit')) {
  idb_registerFetchWatcher({
    eventName: 'idb:importer:sdb',
    match: ({ requestData }) => typeof requestData.data.items !== 'undefined',
  });

  watchSDBChanges();
}

if (URLHas('/quickstock.phtml')) {
  idb_registerFetchWatcher({
    eventName: 'idb:importer:quickstock',
    match: ({ requestData }) => typeof requestData.items !== 'undefined',
  });

  watchQuickstockChanges();
}
