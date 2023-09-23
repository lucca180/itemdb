// ==UserScript==
// @name         itemdb - List Importer
// @version      1.1.0
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
// @icon         https://itemdb.com.br/favicon.ico
// @grant        none
// @noframes
// ==/UserScript==

const items = {};
let indexType = 'item_id';
let list_id = '';

function URLHas(string) {
  return window.location.href.includes(string);
}

function getImageID(url){
  return url.split('/').pop().split('.')[0];
}

const albumID_to_listID={1:137,2:138,3:139,4:148,5:149,6:174,7:175,8:176,9:177,10:178,11:179,12:209,13:210,14:211,15:212,16:213,17:214,18:215,19:216,20:217,21:218,22:219,23:220,24:221,25:222,26:223,27:224,28:225,29:226,30:229,31:230,32:231,33:232,34:233,35:234,36:235,37:236,38:237,39:238,40:239,41:240,42:241,43:242};

function idbButton(){
  return `
    <form target="_blank" action="https://itemdb.com.br/lists/import" method="POST">
      <button type="send" style="padding: 5px;display: inline-flex;background: #2D3748;border-radius: 3px;justify-content: center;align-items: center;gap: 5px;color: white;border: none;cursor: pointer;">
        <img
          src="https://itemdb.com.br/logo_icon.svg"
          width="25px"
          height="auto"
        />
        Import to itemdb
      </button>
      <input type="hidden" id="itemDataJson" name="itemDataJson" value='${JSON.stringify(items)}' />
      <input type="hidden" id="indexType" name="indexType" value='${indexType}' />
      <input type="hidden" id="list_id" name="list_id" value='${list_id}' />
    </form>
  `
};

// ---------- Handlers ---------- //

function handleSDB(){
  const trs = $('form table').eq(2).find('tr').clone().slice(1, -1);
  trs.each(function (i) {
    const tds = $(this).find('td');

    const quantity = tds.eq(-2).text();
    const itemId = tds.last().find('input').attr('name').match(/\d+/)[0];

    items[itemId] = Number(quantity);
  });


  indexType = 'item_id';
  $('#content > table > tbody > tr > td.content > table').before("<center>"+idbButton()+"</center><br/>")
}

function handleGalleryRemovePage(){
  let itemsTrs = $('#quickremove_form tr').slice(1, -2);
  itemsTrs.each(function (i) {
    const itemId = $(this).find('div').first().attr('id');
    const quantity = $(this).find('input').last().val();

    items[itemId] = Number(quantity);
  });

  indexType = 'item_id';
  $('#quickremove_form').before("<center>"+idbButton()+"</center><br/>")
}

function handleCloset(){
  const trs = $('form table').eq(2).find('tr').slice(1, -1);

  trs.each(function (i) {
    const tds = $(this).find('td');

    let itemId = tds.last().find('input').attr('name').match(/\d+/)?.[0];

    if(!itemId) return;
    const quantity = tds.eq(-2).text();

    items[itemId] = Number(quantity);
  });

  indexType = 'item_id';
  $("#content > table > tbody > tr > td.content > form:nth-child(13)").before("<center>"+idbButton()+"</center><br/>")
}

function handleStamps(){
  const isOwner = $('.content center').eq(-1).text().includes("You have");
  if(!isOwner) return;

  const tds = $(".content table td");
  tds.each(function () {
    const img = $(this).find('img');
    if(!img.length) return;

    const image_id = getImageID(img.attr('src'));
    if(image_id === 'no_stamp') return;

    items[image_id] = 1;
  });
  let params = (new URL(document.location)).searchParams;
  let page_id = params.get("page_id");

  list_id = albumID_to_listID[parseInt(page_id)];
  indexType = 'image_id';
  $(".content table").before("<center>"+idbButton()+"</center>")
}

function handleGourmet(){
  const imgs = $(".content p img");
  imgs.each(function () {
    const image_id = getImageID($(this).attr('src'));
    items[image_id] = 1;
  });

  indexType = 'image_id';
  list_id = 72;
  $(".content center").eq(0).before("<center>"+idbButton()+"</center><br/>")
}

function handleNeoDeck(){
  if(nl !== 'en') return;
  $(".content table table a b").each(function () {
    const name = $(this).text().trim();
    items[name] = 1;
  });

  indexType = 'name';
  list_id = 248;

  $(".content table").eq(0).before("<center>"+idbButton()+"</center>")
}

if (URLHas('safetydeposit')) handleSDB();
if (URLHas('gallery/quickremove.phtml')) handleGalleryRemovePage();
if (URLHas('closet.phtml')) handleCloset();
if (URLHas('stamps.phtml')) handleStamps();
if (URLHas('gourmet_club.phtml')) handleGourmet();
if (URLHas('neodeck/index.phtml')) handleNeoDeck();