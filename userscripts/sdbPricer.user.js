  // ==UserScript==
  // @name         itemdb - Safety Deposit Box Pricer
  // @version      1.4.0
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
      let priceStr = '<div style="display: flex;flex-flow: column;justify-content: center;align-items: center; gap: .3rem;">';

      /*
       * If items are missing from the DB, wrap the conditions inside a try -> catch.
       * With this approach, the execution of the script is not interrupted in case an "item.slug" is not parseable.
       */
      try {
        if(!item) throw 'no item';

        if(item.rarity) {
          var color1 = setColor(item.rarity)
          priceStr += `<small style='color:${color1}'><b>r${intl.format(item.rarity)}</b></small>`;
        }

        if(item.status === 'no trade'){
          priceStr += `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">No Trade</a>`;
        }

        if(item.isNC && !item.owls && item.status === 'active'){
          priceStr += `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">NC</a>`;
        }

        if(item.isNC && item.owls){
          priceStr += `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">${item.owls.value}</a><small><br/><a href="https://itemdb.com.br/articles/owls" target="_blank">Owls</a></small>`;
        }

        if(item && item.status !== 'no trade' && !item.price.value && !item.isNC){
          priceStr += `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">???</a>`;
        }

        if(item.price.value){
          priceStr += `<div>`;

          if(item.saleStatus && item.saleStatus.status !== 'regular') {
              var color2 = item.saleStatus.status === 'ets' ? 'green' : '#fb1717';
              priceStr += `<small style='color:${color2}'><b>[${item.saleStatus.status.toUpperCase()}]</b></small> `;
          }

          priceStr += `<a href="https://itemdb.com.br/item/${item.slug}" target="_blank">${item.price.inflated ? "⚠ " : ""}${intl.format(item.price.value)} NP</a>`;
          priceStr += `</div>`;
        }

        if (item.isMissingInfo){
          priceStr += `<div><small><a href="https://itemdb.com.br/contribute" target="_blank"><i>We need info about this item<br/>Learn how to Help</i></a></small></div>`
        }
      } catch(e) { // We're not catching any specific error, as any error that may surface it will be handled with the "We need more info" referral link.
        console.error(e)
        priceStr = `<a>Not Found</a>`;
        priceStr += `<br/><small><a href="https://itemdb.com.br/contribute" target="_blank"><i>We need info about this item<br/>Learn how to Help</i></a></small>`
      }

      priceStr += '</div>';
      tds.eq( -2 ).before(`<td align="center" width="150px">${priceStr}</td>`);
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

  fetchPriceData();