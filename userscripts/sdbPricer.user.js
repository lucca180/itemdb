// ==UserScript==
// @name         Safety Deposit Box Pricer
// @version      1.0.0
// @author       itemdb
// @namespace    itemdb
// @description  Shows the market price for your sdb items
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/safetydeposit.phtml*
// @icon         https://itemdb.com.br/favicon.ico
// @grant        none
// @noframes
// ==/UserScript==

async function handleSDB() {
  const trs = $('form table').eq(2).find('tr').slice(1, -1);

  const IDs = [];

  trs.each(function (i) {
    const tds = $(this).find('td');
    const itemId = tds.last().find('input').attr('name').match(/\d+/)[0];

    IDs.push(itemId);
  });

  const res = await fetch('https://itemdb.com.br/api/v1/items/many',{
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      item_id: IDs
    })
  })

  const itemData = await res.json();

  $('#content > table > tbody > tr > td.content > form > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-child(5)')
  .before('<td align="center" class="contentModuleHeaderAlt" style="text-align: center; width: 70px;" noWrap><img src="https://itemdb.com.br/logo_icon.svg" style="vertical-align: middle;" width="25px" height="auto"/> <b>Price</b></td>');

  $('#content > table > tbody > tr > td.content > form > table:nth-child(3) > tbody > tr:nth-child(34) > td').before("<td></td>");

  const intl = new Intl.NumberFormat();

  trs.each(function (i) {
    const tds = $(this).find('td');
    const itemId = tds.last().find('input').attr('name').match(/\d+/)[0];

    const item = itemData[itemId];
    let priceStr = '';

    if(!item || (item && !item.price.value && !item.isNC)){
      priceStr = '<a href="https://itemdb.com.br/contribute" target="_blank" title="Learn how to help!">???</a></small>'
    }

    if(item && item.isNC){
      priceStr = `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">NC</a>`;
    }

    if(item && item.price.value){
      priceStr = `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">${intl.format(item.price.value)} NP</a>`;
    }
    

    tds.eq( -2 ).before(`<td align="center" noWrap>${priceStr}</td>`);
  })
}

handleSDB();