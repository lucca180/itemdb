  // ==UserScript==
  // @name         itemdb - Safety Deposit Box Pricer
  // @version      1.5.4
  // @author       itemdb
  // @namespace    itemdb
  // @description  Shows the market price for your sdb/closet items
  // @website      https://itemdb.com.br
  // @match        *://*.itemdb.com.br/*
  // @match        *://*.neopets.com/safetydeposit.phtml*
  // @match        *://*.neopets.com/closet.phtml*
  // @icon         https://itemdb.com.br/favicon.ico
  // @connect      itemdb.com.br
  // @grant        GM_xmlhttpRequest
  // @noframes
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

async function fetchPriceData(){
  const trs = $('form table').eq(2).find('tr').slice(1, -1);

  const IDs = [];

  trs.each(function (i) {
    const tds = $(this).find('td');
    const itemId = tds.last().find('input').attr('name').match(/\d+/)?.[0] ?? tds.last().find('input').data('item_id')

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
        pricePage(itemData);
      }

      else return console.error('[itemdb] Failed to fetch price data', res);
    }
  });
}

async function pricePage(itemData) {
  const trs = $('form table').eq(2).find('tr').slice(1, -1);

  let headingSelector = '.content > form > table:nth-child(3) > tbody > tr:nth-child(1) > td:nth-last-child(2)';
  if(URLHas('closet')) headingSelector = "form[action='process_closet.phtml'] th:nth-of-type(5)";

  $(headingSelector)
  .before('<td align="center" class="contentModuleHeaderAlt" style="text-align: center; width: 70px;" noWrap><img src="https://itemdb.com.br/logo_icon.svg" style="vertical-align: middle;" width="25px" height="auto"/> <b>Price</b></td>');

  let footerSelector = '.content > form > table:nth-child(3) > tbody > tr:last-child > td';
  if(URLHas('closet')) footerSelector = "form[action='process_closet.phtml'] tbody tr:last-of-type td"

  $(footerSelector).before("<td></td>");

  const intl = new Intl.NumberFormat();

  let grandTotal = 0

  trs.each(function (i) {
    const tds = $(this).find('td');
    const itemId = tds.last().find('input').attr('name').match(/\d+/)?.[0] ?? tds.last().find('input').data('item_id');

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

        priceStr += `<small style='color:${color1}'><b>r${item.rarity}</b>`;
        if(item.ff_points) priceStr += ` - <b>${item.ff_points} pts</b>`;
        priceStr += `</small> `
      }

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

        const itemQtyCol = tds.eq(-2)[0];
        const itemQty = parseInt(itemQtyCol.textContent)
        const totalValue = item.price.value * itemQty;
        grandTotal += totalValue

        if (itemQty > 1){
            priceStr += `<small style='color: #000000'><b>${intl.format(totalValue)} NP total</b></small> `
        }
      }

      if (item.isMissingInfo){
        priceStr += `<div><small><a href="https://itemdb.com.br/contribute?utm_content=sdbPricer" target="_blank"><i>We need info about this item<br/>Learn how to Help</i></a></small></div>`
      }
    } catch(e) { // We're not catching any specific error, as any error that may surface it will be handled with the "We need more info" referral link.
      console.error(e)
      priceStr = `<a>Not Found</a>`;
      priceStr += `<br/><small><a href="https://itemdb.com.br/contribute?utm_content=sdbPricer" target="_blank"><i>We need info about this item<br/>Learn how to Help</i></a></small>`
    }

    priceStr += '</div>';
    tds.eq( -2 ).before(`<td align="center" width="150px">${priceStr}</td>`);
  })

    $(footerSelector).parent().before(`
<tr bgcolor="silver">
  <th colspan="3" class="contentModuleHeaderAlt" style="text-align: center;"></th>
  <th class="contentModuleHeaderAlt" style="text-align: right;">Total:</th>
  <td align="center" class="contentModuleHeaderAlt" style="text-align: center; width: 70px;" nowrap="">
    <b>${intl.format(grandTotal)} NP</b>
  </td>
  <th colspan="2" class="contentModuleHeaderAlt" style="text-align: center;"></th>
</tr>
`);

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

if (URLHas('safetydeposit') || URLHas('closet')) fetchPriceData();
