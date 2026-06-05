// ==UserScript==
// @name         itemdb - List Importer
// @version      1.3.2
// @author       itemdb
// @namespace    itemdb
// @description  Imports items to your wishlists
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/closet.phtml*
// @match        *://*.neopets.com/safetydeposit.phtml*
// @match        *://*.neopets.com/gallery/quickremove.phtml*
// @match        *://*.neopets.com/stamps.phtml*
// @match        *://*.neopets.com/gourmet_club.phtml*
// @match        *://*.neopets.com/games/neodeck/index.phtml*
// @match        *://*.neopets.com/books_read.phtml*
// @match        *://*.neopets.com/moon/books_read.phtml*
// @match        *://*.itemdb.com.br/*
// @icon         https://itemdb.com.br/favicon.ico
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

const albumID_to_listID={1:137,2:138,3:139,4:148,5:149,6:174,7:175,8:176,9:177,10:178,11:179,12:209,13:210,14:211,15:212,16:213,17:214,18:215,19:216,20:217,21:218,22:219,23:220,24:221,25:222,26:223,27:224,28:225,29:226,30:229,31:230,32:231,33:232,34:233,35:234,36:235,37:236,38:237,39:238,40:239,41:240,42:241,43:242,44:1144,45:1729,46:3453,47:2520,48:7818};

const originalFetch = window.fetch;

let item_list = {};

const itemdb_importer = function() {
  function createImportButton() {
    return $(`
      <button type="button" style="padding: 5px;display: inline-flex;background: #2D3748;border-radius: 3px;justify-content: center;align-items: center;gap: 5px;color: white;border: none;cursor: pointer;">
        <img
          src="https://itemdb.com.br/logo_icon.svg"
          width="25px"
          height="auto"
        />
        Import to itemdb
      </button>
    `);
  }

  function submitImport({ items, indexType, listId = '' }) {
    const form = document.createElement('form');
    form.action = 'https://itemdb.com.br/api/v1/lists/import-session';
    form.method = 'POST';
    form.target = '_blank';
    form.style.display = 'none';

    const fields = {
      itemDataJson: JSON.stringify(items),
      indexType,
      list_id: listId,
    };

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
      listId: '',
    };
  }

  function handleGalleryRemovePage(){
    return {
      items: collectGalleryRemoveItems(),
      indexType: 'item_id',
      listId: '',
    };
  }

  function handleCloset(){
    return {
      items: collectClosetItems(),
      indexType: 'item_id',
      listId: '',
    };
  }

  function handleStamps(){
    let params = (new URL(document.location)).searchParams;
    let page_id = params.get("page_id");

    return {
      items: collectStampItems(),
      indexType: 'image_id',
      listId: albumID_to_listID[parseInt(page_id)],
    };
  }

  function handleGourmet(){
    return {
      items: collectImageItems($(".content p img")),
      indexType: 'image_id',
      listId: 72,
    };
  }

  function handleNeoDeck(){
    return {
      items: collectNeoDeckItems(),
      indexType: 'name',
      listId: 248,
    };
  }

  function handleBooks(){
    return {
      items: collectImageItems($(".content table img")),
      indexType: 'image_id',
      listId: URLHas('moon') ? 663 : 664,
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

  function canImportStamps() {
    return $('.content center').eq(-1).text().includes("You have");
  }

  function canImportNeoDeck() {
    return nl === 'en';
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

  targetWindow.__idbFetchWatchers.push({ match, eventName });
}

if (URLHas('/closet')) {
  registerFetchWatcher({
    eventName: 'idb:importer:closet',
    match: ({ requestData }) => typeof requestData.items !== 'undefined',
  });

  watchClosetChanges();
}

if (URLHas('/safetydeposit')) {
  registerFetchWatcher({
    eventName: 'idb:importer:sdb',
    match: ({ requestData }) => typeof requestData.data.items !== 'undefined',
  });

  watchSDBChanges();
}
