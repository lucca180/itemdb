  // ==UserScript==
  // @name         itemdb - Sort Gallery
  // @version      1.0.3
  // @author       itemdb
  // @namespace    itemdb
  // @description  Sorts your gallery by color
  // @website      https://itemdb.com.br
  // @match        *://*.neopets.com/gallery/index.phtml*
  // @match        *://*.itemdb.com.br/*
  // @icon         https://itemdb.com.br/favicon.ico
  // @grant        none
  // @noframes
  // ==/UserScript==

  // itemdb troubleshooting - https://itemdb.com.br/tools/troubleshooting

  const script_info = {
    version: GM_info.script.version,
    versionCode: Number(GM_info.script.version.replaceAll(".", ""))
  }

  if(typeof unsafeWindow !== "undefined") 
    unsafeWindow.itemdb_sortGallery = script_info;
  else window.itemdb_sortGallery = script_info;

  if(!window.location.href.includes("neopets.com")) return;

  // -------------------- //

  const items = {};

  function URLHas(string) {
    return window.location.href.includes(string);
  }

  function idbButton(){
    return `
    <div style="background-color:white;padding:4px;border-style:solid;border-width:1px;">
      <p style="text-align: center; color: red;" id="itemdb-sorter-msgs"></p>
      <p style="display: inline-flex;justify-content: center;align-items: center;gap: 5px; text-align: center;"> 
        <a href="http://itemdb.com.br/" target="_blank">  
        <img
            src="https://itemdb.com.br/logo_icon.svg"
            width="25px"
            height="auto"
          />
        </a>
        Sort by:
      </p>
      <div style="display: inline-flex;justify-content: center;flex-wrap: wrap;gap: 5px;">
        <button class="itemdb-sort" id="vibrant">Vibrant</button>
        <button class="itemdb-sort" id="darkvibrant">Dark Vibrant</button>
        <button class="itemdb-sort" id="lightvibrant">Light Vibrant</button>
        <button class="itemdb-sort" id="muted">Muted</button>
        <button class="itemdb-sort" id="darkmuted">Dark Muted</button>
        <button class="itemdb-sort" id="lightmuted">Light Muted</button>
        <button class="itemdb-sort" id="population">Population</button>
      </div>
      <div style="display: inline-flex;justify-content: center;flex-wrap: wrap;gap: 5px; margin-top: 20px;">
        <button class="itemdb-sort" id="vibrant-reverse">Vibrant Reverse</button>
        <button class="itemdb-sort" id="darkvibrant-reverse">Dark Vibrant Reverse</button>
        <button class="itemdb-sort" id="lightvibrant-reverse">Light Vibrant Reverse</button>
        <button class="itemdb-sort" id="muted-reverse">Muted Reverse</button>
        <button class="itemdb-sort" id="darkmuted-reverse">Dark Muted Reverse</button>
        <button class="itemdb-sort" id="lightmuted-reverse">Light Muted Reverse</button>
        <button class="itemdb-sort" id="population-reverse">Population Reverse</button>
      </div>
    </div>
    `
  };

  // ---------- Handlers ---------- //

  const images_ids = [];
  let image_colors = {};
  let image_order = {};
  let colorFetched = false;

  function addButtons() {
    $('#gallery_form').parent().before(idbButton());
    $('.itemdb-sort').click(function(){
      sortGallery(this.id);
    });
  }

  async function sortGallery(type){
    if(!images_ids.length){
      let itemsTrs = $('#gallery_form td');
      
      itemsTrs.each(function (i) {
        const image_id = $(this).find('.itemimg').attr('src')?.match(/[^\.\/]+(?=\.gif)/)?.[0];
        if(!image_id) return;

        images_ids.push(image_id);
      });
    }

    setMsg('Fetching colors from itemdb...')
    if(!colorFetched)
      await fetchColors();

    setMsg('Sorting gallery by ' + type);
    sortImageIds(type);
    applySort();
    setMsg('Success! Gallery sorted by ' + type);

  }

  async function fetchColors(){
    const res = await fetch('https://itemdb.com.br/api/v1/items/colors', {
      method: 'POST',
      keepalive: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_id: images_ids,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      image_colors = data;
      colorFetched = true;
    } else {
      console.error('[itemdb - Gallery Sorter] fetchColors error:', res);
      setMsg('Failed to fetch colors from itemdb', true);
      throw new Error('Failed to fetch colors from itemdb');
    }
  }

  function sortImageIds(sortType){
    const isReverse = sortType.includes('reverse');
    if(isReverse)
      sortType = sortType.replace('-reverse', '');

    images_ids.sort((a,b) => {
      let aColor, bColor;

      if(sortType !== 'population'){
        aColor = image_colors[a][sortType];
        bColor = image_colors[b][sortType];
      }

      else{
        aColor = findMaxPopulation(image_colors[a]);
        bColor = findMaxPopulation(image_colors[b]);
      }

      if(isReverse)
      return bColor.hsv[0] - aColor.hsv[0] || bColor.hsv[1] - aColor.hsv[1] || bColor.hsv[2] - aColor.hsv[2];

      return aColor.hsv[0] - bColor.hsv[0] || aColor.hsv[1] - bColor.hsv[1] || aColor.hsv[2] - bColor.hsv[2];
    })

    image_order = {};
    images_ids.forEach((id, index) => {
      image_order[id] = index;
    });
  }

  function applySort(){
    const shiftList = []
    let itemsTrs = $('#gallery_form td');
    let notFound = [];
    itemsTrs.each(function (i) {
      let image_id = $(this).find('.itemimg').attr('src')?.match(/[^\.\/]+(?=\.gif)/)?.[0];
      
      if(image_id)
        shiftList.push(image_id);
      
      const input = $(this).find('.glry_rank');
      if(input.length){
        image_id = shiftList.shift();
        let pos = image_order[image_id];
        
        if(typeof pos === 'undefined') {
          console.error('[itemdb - Gallery Sorter] Image ID not found in order:', image_id);
          notFound.push(image_id);
          pos = 0;
        }

        pos = Math.max(0, pos+1);
        input.val(pos);
        // let changed_value = pos
        // let nearest_val = input.siblings('input[type=hidden]').attr('value');
        // let total_length = $('.glry_rank').length;

        input.siblings('input[type=hidden]').attr('data-prv_rank','y');
        input.attr('data-new_rank','y');
      }
    });

    if(notFound.length){
      console.warn('[itemdb - Gallery Sorter] Some images were not found in the color data:', notFound);
      setMsg('Some images were not found in the color data. Check console for details.', true);
      throw new Error('[itemdb - Gallery Sorter] Missing images in color data');
    }
  }

  function findMaxPopulation(colorData){
    let max = 0;
    let maxColor = null;
    for(let color in colorData){
      if(colorData[color].population > max){
        max = colorData[color].population;
        maxColor = colorData[color];
      }
    }
    return maxColor;
  }

  function setMsg(text, isError = false){
    const msgEl = $('#itemdb-sorter-msgs');
    text = isError ? `Error: ${text}` : text;
    msgEl.text(text);
    msgEl.css('font-weight', isError ? 'bold' : 'normal');
  }

  if (URLHas('dowhat=rank')) addButtons();
