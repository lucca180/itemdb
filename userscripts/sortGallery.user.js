  // ==UserScript==
  // @name         itemdb - Sort Gallery
  // @version      1.0.0
  // @author       itemdb
  // @namespace    itemdb
  // @description  Sorts your gallery by color
  // @website      https://itemdb.com.br
  // @match        *://*.neopets.com/gallery/index.phtml*
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
    <div style="background-color:white;padding:4px;border-style:solid;border-width:1px;">
      <p style="display: inline-flex;bjustify-content: center;align-items: center;gap: 5px;"> 
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
    </div>
    `
  };

  // ---------- Handlers ---------- //

  const images_ids = [];
  let image_colors = {};
  let colorFetched = false;

  function addButtons() {
    $('#content > table > tbody > tr > td.content > div > div > table > tbody > tr > td > div > b').before(idbButton());
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

    if(!colorFetched)
      await fetchColors();
    
    sortImageIds(type);
    applySort();
  }

  async function fetchColors(){
    const res = await fetch('https://itemdb.com.br/api/v1/items/colors', {
      method: 'POST',
      keepalive: true,
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
      console.error('[itemdb] fetchColors error:', res);
    }
  }

  function sortImageIds(sortType){
    images_ids.sort((a,b) => {
      if(sortType !== 'population'){
        const aColor = image_colors[a][sortType];
        const bColor = image_colors[b][sortType];
        return aColor.hsv[0] - bColor.hsv[0] || aColor.hsv[1] - bColor.hsv[1] || aColor.hsv[2] - bColor.hsv[2];
      }
      else{
        const aColor = findMaxPopulation(image_colors[a]);
        const bColor = findMaxPopulation(image_colors[b]);
        return aColor.hsv[0] - bColor.hsv[0] || aColor.hsv[1] - bColor.hsv[1] || aColor.hsv[2] - bColor.hsv[2];
      }
    })
  }

  function applySort(){
    const shiftList = []
    let itemsTrs = $('#gallery_form td');

    itemsTrs.each(function (i) {
      let image_id = $(this).find('.itemimg').attr('src')?.match(/[^\.\/]+(?=\.gif)/)?.[0];
      
      if(image_id)
        shiftList.push(image_id);
      
      const input = $(this).find('.glry_rank');
      if(input.length){
        image_id = shiftList.shift();
        let pos = images_ids.indexOf(image_id);
        pos = Math.max(0, pos+1);
        input.val(pos);
        // let changed_value = pos
        // let nearest_val = input.siblings('input[type=hidden]').attr('value');
        // let total_length = $('.glry_rank').length;

        input.siblings('input[type=hidden]').attr('data-prv_rank','y');
        input.attr('data-new_rank','y');
      }
    });
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

  if (URLHas('dowhat=rank')) addButtons();
