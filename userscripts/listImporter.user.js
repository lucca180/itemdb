// ==UserScript==
// @name         itemdb - List Importer
// @version      1.0.0
// @namespace    itemdb
// @description  Imports items to your wishlists
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/closet.phtml*
// @match        *://*.neopets.com/safetydeposit.phtml*
// @match        *://*.neopets.com/gallery/quickremove.phtml*
// @icon         https://itemdb.com.br/favicon.ico
// @grant        none
// @noframes
// ==/UserScript==

const items = {};

function URLHas(string) {
  return window.location.href.includes(string);
}

function idbButton(){
  return `
    <form target="_blank" action="http://localhost:3000/lists/import" method="POST">
      <button type="send" style="padding: 5px;display: inline-flex;background: #2D3748;border-radius: 3px;justify-content: center;align-items: center;gap: 5px;color: white;border: none;cursor: pointer;">
        <img
          src="https://itemdb.com.br/logo_icon.svg"
          width="25px"
          height="auto"
        />
        Import to itemdb list
      </button>
      <input type="hidden" id="itemDataJson" name="itemDataJson" value='${JSON.stringify(items)}' />
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

  $('#content > table > tbody > tr > td.content > table').before("<center>"+idbButton()+"</center><br/>")
}

function handleGalleryRemovePage(){
  let itemsTrs = $('#quickremove_form tr').slice(1, -2);
  itemsTrs.each(function (i) {
    const itemId = $(this).find('div').first().attr('id');
    const quantity = $(this).find('input').last().val();

    items[itemId] = Number(quantity);
  });

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

  $("#content > table > tbody > tr > td.content > form:nth-child(13)").before("<center>"+idbButton()+"</center><br/>")
}

if (URLHas('safetydeposit')) handleSDB();
if (URLHas('gallery/quickremove.phtml')) handleGalleryRemovePage();
if (URLHas('closet.phtml')) handleCloset();
