// ==UserScript==
// @name         itemdb - Stamp Album Helper
// @version      1.0.1
// @author       originally EatWooloos, updated by itemdb
// @namespace    itemdb
// @description  Adds an info menu about your missing stamps
// @icon         https://itemdb.com.br/favicon.ico
// @match        *://*.neopets.com/stamps.phtml?type=album&page_id=*
// @connect      itemdb.com.br
// @grant        GM_xmlhttpRequest
// ==/UserScript==

let hasPremium;
let owner;

if (!document.URL.includes("progress")) {
     hasPremium = !!$("#sswmenu .imgmenu").length;
     owner = location.search.match(/owner=(.+)&*/)?.[1] || appInsightsUserName;
}

/****************************************************************************************
 *
 *  < Stamp Album Helper by u/Eat_Wooloo_As_Mutton and updated by itemdb >
 *
 *  This script helps you find and fill up your missing stamps much quicker and easier
 *  without having to open up an external database like itemdb or jn in another tab.
 *
 *  This script uses some functionality from diceroll's Search Helper script
 *  (https://github.com/diceroll123/NeoSearchHelper)
 *
 *  Stamp list dinamically updated from itemdb.com.br
 *
 ****************************************************************************************/
let thisPage = {};

const format = new Intl.NumberFormat().format;
const albumID = location.search.match(/page_id=(\d+)&*/)[1];

const getStampList = async () => {
  GM_xmlhttpRequest({
    method: 'GET',
    url: 'https://itemdb.com.br/api/v1/tools/album-helper?album_id='+albumID,
    headers: {
      'Content-Type': 'application/json'
    },
    onload: function (res) {
      if (res.status === 200) {
        thisPage = JSON.parse(res.responseText);
        replaceImages();
      }

      else return console.error('[itemdb] Failed to fetch price data', res);
    }
  });
}

if(document.URL.includes("page_id=")){
    getStampList();
}

$("body").append(`
    <style>
        .fake-stamp {
            opacity: 25% !important;
        }
        .stamp-info {
            display: none;
        }
        .stamp-info.visible {
            display: block;
            text-align: center;
        }
        .stamp-info-table {
            width: 450px;
            margin: auto;
            border: 1px solid #b1b1b1;
            border-collapse: collapse;
        }
        .stamp-info-table td {
            padding: 6px;
        }
        .searchimg {
            width: 35px !important;
            height: 35px !important;
        }
        .content table img {
            cursor: pointer;
        }
        .stamp-selected {
            /* Green border box */
            background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFoAAABaCAIAAAC3ytZVAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAECSURBVHhe7dBBEYAwEARBtKAnZqMQfhRzFtJba2D6uvfy7zhyHDmOHEc+OZ7DNvJxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJB9H8nEkH0fycSQfR/JxJH9yHH4cOY4cR47j971exW0rqwgJ0K4AAAAASUVORK5CYII=) no-repeat;
        }
        .stamp-info-arrow:hover {
            background: #dfdfdf;
        }
    </style>
`);

const replaceImages = () => {
  // Replace the images
  let infoContent = {};
  let totalNeeded = 0;
  $(".content table img").each(function (index, element) {
    var position, itemData;
    var name, rarity, img;

    if(thisPage[index+1]) {
      var { position, itemData } = thisPage[index+1];
      var { name, rarity, image } = itemData;
      img = image;
      
    }
    else {
      position = index + 1;
      name = "No Stamp";
      rarity = "r0";
      img = "http://images.neopets.com/items/stamp_blank.gif";
    }

    $(element).attr("position", position).attr("rarity", rarity);

    if ($(element).attr("alt") === "No Stamp" && name !== "No Stamp") {
      $(element)
        .addClass("fake-stamp")
        .attr("title", name)
        .attr("src", `${img}`)
        .attr("alt", name)
        .attr("rarity", rarity);

      if(itemData && itemData.price.value)
        totalNeeded += itemData.price.value;
    }

    infoContent[position] = createInfoContent(element, itemData);

    $(element).on("click", function () {
      $(".stamp-info").html(infoContent[position]).show();
      $(".content table td").removeClass("stamp-selected");
      $(element).parent().addClass("stamp-selected");
    });

    if (hasPremium && name !== "No Stamp") {
      $(element).on("dblclick", function () {
        sswopen(name);
      });
    }
  });

  $(".content center:last-of-type").after(`<p></p><center>You would need <b>${format(totalNeeded)} NP</b> to complete this album at this time</center>`);
};

function createInfoContent(imgElement, itemData) {

    const $img = $(imgElement),
        src = $img.attr("src"),
        stampName = $img.attr("alt"),
        position = $img.attr("position"),
        rarity = $img.attr("rarity");

    if (stampName === "No Stamp") {
        return `
<br>
<table class="stamp-info-table">
    <tr>
        <td class="stamp-info-arrow prev-arrow" rowspan="5"><img alt="Previous" src="http://images.neopets.com/themes/h5/premium/images/arrow-left.svg" style="width: 20px"></td>
        <td rowspan="5" style="width: 30%; text-align: center;"><img src="${src}"></td>
        <td style="text-align: center; font-weight: bold; padding: 12px;">${stampName}</td>
        <td class="stamp-info-arrow next-arrow" rowspan="5"><img alt="Next" src="http://images.neopets.com/themes/h5/premium/images/arrow-right.svg" style="width: 20px"></td>
    </tr>
    <tr>
        <td>Position: <b id="current-stamp-pos">${position}</b></td>
    </tr>
    <tr>
        <td>This stamp hasn't been released yet.</td>
    </tr>
    <tr>
        <td></td>
    </tr>
    <tr>
        <td style="text-align: center;"></td>
    </tr>
</table>
        `;
    }

    const hasStamp = $img.hasClass("fake-stamp") === false;

    // const hasStampText = `<b>${owner}</b> ${hasStamp ? '<b style="color: green">has</b>' : '<b style="color: red">doesn\'t have</b>'} this stamp.`;
    const hasStampText = `Status: ${hasStamp ? '<b style="color: green">Collected!</b>' : '<b style="color: red">Not collected</b>'}`;

    const rarityText = r => {
        const rNum = parseInt(r.replace(/r/, ``));
        if (rNum <= 74) return 'r'+r;
        else if (rNum >= 75 && rNum <= 84) return `<strong style="color:green">r${r} (uncommon)</strong>`;
        else if (rNum >= 85 && rNum <= 89) return `<strong style="color:green">r${r} (rare)</strong>`;
        else if (rNum >= 90 && rNum <= 94) return `<strong style="color:green">r${r} (very rare)</strong>`;
        else if (rNum >= 95 && rNum <= 98 || rNum === 100) return `<strong style="color:green">r${r} (ultra rare)</strong>`;
        else if (rNum === 99) return `<strong style="color:green">r${r} (super rare)</strong>`;
        else if (rNum >= 101 && rNum <= 104) return `<strong style="color:#aa4455">r${r} (special)</strong>`;
        else if (rNum >= 105 && rNum <= 110) return `<strong style="color:red">r${r} (MEGA RARE)</strong>`;
        else if (rNum >= 111 && rNum <= 179) return `<strong style="color:red">r${r} (RARITY ${rNum})</strong>`;
        else if (rNum === 180) return `<strong style="color:#666666">r${r} (retired)</strong>`;
        else if (rNum === 200) return `<strong style="color:red">r${r} (Artifact - 200)</strong>`;
    };

    const createHelper = itemName => {
        // From diceroll's Search Helper script - https://github.com/diceroll123/NeoSearchHelper
        const linkmap = { // for urls and images for each search type
            ssw: {
                img: "http://images.neopets.com/premium/shopwizard/ssw-icon.svg"
            },
            sw: {
                url: "http://www.neopets.com/shops/wizard.phtml?string=%s",
                img: "http://images.neopets.com/themes/h5/basic/images/shopwizard-icon.png"
            },
            tp: {
                url: "http://www.neopets.com/island/tradingpost.phtml?type=browse&criteria=item_exact&search_string=%s",
                img: "http://images.neopets.com/themes/h5/basic/images/tradingpost-icon.png"
            },
            au: {
                url: "http://www.neopets.com/genie.phtml?type=process_genie&criteria=exact&auctiongenie=%s",
                img: "http://images.neopets.com/themes/h5/basic/images/auction-icon.png"
            },
            sdb: {
                url: "http://www.neopets.com/safetydeposit.phtml?obj_name=%s&category=0",
                img: "http://images.neopets.com/images/emptydepositbox.gif"
            },
            jni: {
                url: "https://items.jellyneo.net/search/?name=%s&name_type=3",
                img: "http://images.neopets.com/items/toy_plushie_negg_fish.gif"
            },
            idb: {
                url: "https://itemdb.com.br/item/%s",
                img: "https://itemdb.com.br/favicon.svg"
            }
        };

        const slugify = (text) => {
          return text
            .toString()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-');
        };

        const combiner = (item, url, image) => {
            url = url.replace("%s", item);
            return `<a tabindex='-1' target='_blank' href='${url}'><img src='${image}' class='searchimg'></a>`;
        };

        const sswhelper = item => {
            let ssw = ``;
            if (hasPremium) {
                ssw = `<img item="${item}" class="stamp-ssw-helper searchimg" src="${linkmap.ssw.img}">`;
            }
            return ssw;
        };

        return `<span class="search-helper">${sswhelper(itemName)}${combiner(itemName, linkmap.sw.url, linkmap.sw.img)}${combiner(itemName, linkmap.tp.url, linkmap.tp.img)}${combiner(itemName, linkmap.au.url, linkmap.au.img)}${combiner(itemName, linkmap.sdb.url, linkmap.sdb.img)}${combiner(itemName, linkmap.jni.url, linkmap.jni.img)}${combiner(slugify(itemName), linkmap.idb.url, linkmap.idb.img)}</span>`;
    };

    return `<br>
<table class="stamp-info-table" item="${stampName}">
    <tr>
        <td class="stamp-info-arrow prev-arrow" rowspan="5"><img alt="Previous" src="http://images.neopets.com/themes/h5/premium/images/arrow-left.svg" style="width: 20px"></td>
        <td rowspan="5" style="width: 30%; text-align: center;"><img src="${src}"></td>
        <td style="text-align: center; font-weight: bold; padding: 12px;">${stampName}<br>${rarityText(rarity)}</td>
        <td></td>
        <td class="stamp-info-arrow next-arrow" rowspan="5"><img alt="Next" src="http://images.neopets.com/themes/h5/premium/images/arrow-right.svg" style="width: 20px"></td>
    </tr>
    <tr>
        <td>Position: <b id="current-stamp-pos">${position}</b></td>
    </tr>
    <tr>
        <td>Price: <a href="https://itemdb.com.br/item/${itemData.slug}" target="_blank"><b>${itemData.price.inflated ? "⚠️" : ""}${itemData.price.value ? format(itemData.price.value) + " NP" : "Unknown"}</b></a></td>
    </tr>
    <tr>
        <td>${hasStampText}</td>
    </tr>
    <tr>
        <td style="text-align: center; padding: 16px 6px;">${createHelper(stampName)}</td>
    </tr>
</table>
    `;
}

// Add stamp info menu
$(".content table").after(`<p class="stamp-info"></p>`);

// Add right-click tip
if (hasPremium) {
    $(".content table").before(`<p style="text-align: center; font-style: italic; color: green; font-weight: bold">Double-click the stamp to search it<br>on the Super Shop Wizard!</p>`)
}

const idbLogo = `<img src="https://itemdb.com.br/favicon.svg" style="width: 30px; height: 30px; vertical-align: middle;">`;
$(".content").append(`<p style="text-align: center;"><a href="https://itemdb.com.br/api/v1/tools/album-helper?album_id=${albumID}&redirect=true" target="_blank">${idbLogo}&nbsp;Album info&nbsp;${idbLogo}</a></p>`);

// SSW icon
$("body").on("click", ".stamp-ssw-helper", function () {
    const item = $(this).attr("item");
    sswopen(item);
});

function sswopen(item) {
    if ($(".sswdrop").hasClass("panel_hidden")) {
        $("#sswmenu .imgmenu").click();
    }
    if ($("#ssw-tabs-1").hasClass("ui-tabs-hide")) {
        $("#button-new-search").click();
    }

    $("#ssw-criteria").val("exact");
    $("#searchstr").val(item);
}

// Stamp prev/next arrow
$("body").on("click", ".stamp-info-arrow", function () {
    const isNext = $(this).hasClass("next-arrow");
    const isPrev = $(this).hasClass("prev-arrow");

    const position = parseInt($("#current-stamp-pos").html());
    console.log(position);

    const newPosition = (function () {
        if (position === 25 && isNext) {
            return 1;
        }
        else if (position === 1 && isPrev) {
            return 25;
        }
        else if (isNext) {
            return position + 1;
        }
        else if (isPrev) {
            return position - 1;
        }
    })();

    $(`img[position='${newPosition}']`).click();
});