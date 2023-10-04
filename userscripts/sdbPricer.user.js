  // ==UserScript==
  // @name         itemdb - Safety Deposit Box Pricer
  // @version      1.2.1
  // @author       itemdb
  // @namespace    itemdb
  // @description  Shows the market price for your sdb items
  // @website      https://itemdb.com.br
  // @match        *://*.neopets.com/safetydeposit.phtml*
  // @icon         https://itemdb.com.br/favicon.ico
  // @connect      itemdb.com.br
  // @grant        GM_xmlhttpRequest
  // @noframes
  // ==/UserScript==

  async function fetchPriceData(){
    const trs = $('form table').eq(2).find('tr').slice(1, -1);

    const IDs = [];

    trs.each(function (i) {
      const tds = $(this).find('td');
      const itemId = tds.last().find('input').attr('name').match(/\d+/)[0];

      IDs.push(itemId);
    });

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
          priceSDB(itemData);
        }
        
        else return console.error('[itemdb] Failed to fetch price data', res);
      }
    });
  }

  async function priceSDB(itemData) {
    const trs = $('form table').eq(2).find('tr').slice(1, -1);

    $('#content > table > tbody > tr > td.content > form > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-last-child(2)')
    .before('<td align="center" class="contentModuleHeaderAlt" style="text-align: center; width: 70px;" noWrap><img src="https://itemdb.com.br/logo_icon.svg" style="vertical-align: middle;" width="25px" height="auto"/> <b>Price</b></td>');

    $('#content > table > tbody > tr > td.content > form > table:nth-child(3) > tbody > tr:last-child > td').before("<td></td>");

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
      
      if(item && item.rarity && rarityToCCPoints(item.rarity)) {
        priceStr += `<br/><small><i>${item.internal_id === 289 ? 1 : rarityToCCPoints(item.rarity)}  Point${rarityToCCPoints(item.rarity) > 1 && item.internal_id !== 289 ? 's' : ''}</i></small>`
      }

      if(item && !item.rarity){
        priceStr += `<br/><small><a href="https://itemdb.com.br/contribute" target="_blank"><i>Unknown Rarity<br/>Learn how to Help</i></a></small>`
      } 
      else if (item.isMissingInfo){
        priceStr += `<br/><small><a href="https://itemdb.com.br/contribute" target="_blank"><i>We need some info about this item<br/>Learn how to Help</i></a></small>`

      }

      tds.eq( -2 ).before(`<td align="center" noWrap>${priceStr}</td>`);
    })
  }

  fetchPriceData();

  function rarityToCCPoints(rarity) {
    if (rarity <= 79 || rarity === 101) return 1;
    if (rarity <= 89) return 2;
    if (rarity <= 97) return 6;
    if (rarity <= 100) return 4;
    if (rarity <= 179) return 8;

    return 0;
  }