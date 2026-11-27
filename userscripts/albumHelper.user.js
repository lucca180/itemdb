// ==UserScript==
// @name         itemdb - Stamp Album Helper
// @version      2.1.1
// @author       itemdb
// @namespace    itemdb
// @description  Shows the price of your missing stamps, your album progress and imports it to your itemdb checklist
// @icon         https://itemdb.com.br/favicon.ico
// @match        *://*.neopets.com/stamps.phtml?type=album&page_id=*
// @match        *://*.itemdb.com.br/*
// @require      https://itemdb.com.br/js/script-utils.js?v3
// @connect      itemdb.com.br
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        unsafeWindow
// ==/UserScript==

// itemdb troubleshooting - https://itemdb.com.br/tools/troubleshooting
// The previous version lives in albumHelperLegacy.user.js
const script_info = {
  version: GM_info.script.version,
  versionCode: Number(GM_info.script.version.replaceAll(".", ""))
}

if(typeof unsafeWindow !== "undefined")
  unsafeWindow.itemdb_albumHelper = script_info;
else window.itemdb_albumHelper = script_info;

if(!window.location.href.includes("neopets.com")) return;

/****************************************************************************************
 *
 *  < Stamp Album Helper by u/Eat_Wooloo_As_Mutton and updated by itemdb >
 *
 *  - Missing stamps show their image (faded) and price (switch "Prices on stamps" below the album)
 *  - Click a stamp to see its rarity, price and where to search it (arrow keys move between stamps)
 *  - Progress bar with the NP needed to complete the album and an import to your itemdb checklist
 *
 *  This script uses some functionality from diceroll's Search Helper script
 *  (https://github.com/diceroll123/NeoSearchHelper)
 *
 ****************************************************************************************/

const albumID = location.search.match(/page_id=(\d+)/)?.[1];
if (!albumID) return;

const hasPremium = !!$("#sswmenu .imgmenu").length;
// the "You have N stamps on this page!" line only shows on your own album
const $youHave = $(".content center").filter(function () {
  return /You have \d+ stamps?/.test($(this).text());
}).last();
const isOwnAlbum = $youHave.length > 0;

const fmt = new Intl.NumberFormat().format;
const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format;

const LOGO = "https://itemdb.com.br/logo_icon.svg";
const ACCENT = "#FFCC00";
const albumLink = `https://itemdb.com.br/api/v1/tools/album-helper/redirect?album_id=${albumID}`;

// ---------- styles ---------- //
$("head").append(`<style>
  .idb { font-family: -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #E2E8F0; line-height: 1.4; text-align: left; }
  .idb * { box-sizing: border-box; }
  .idb a { color: inherit; }
  .idb-card { background: #1A202C; border: 1px solid #2D3748; border-radius: 10px; padding: 14px; width: 450px; margin: 12px auto; box-shadow: 0 4px 14px rgba(0,0,0,.18); }
  .idb-row { display: flex; align-items: center; gap: 10px; }
  .idb-col { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
  .idb-muted { color: #A0AEC0; font-size: 12px; }
  .idb-title { font-weight: 700; font-size: 15px; color: #fff; }
  .idb-hint { color: #718096; font-size: 11px; }
  .idb-badge { display: inline-flex; align-items: center; gap: 4px; padding: 1px 7px; border-radius: 999px; font-size: 11px; font-weight: 600; white-space: nowrap; }
  .idb-badge.gray   { background: rgba(160,174,192,.16); color: #CBD5E0; }
  .idb-badge.green  { background: rgba(104,211,145,.16); color: #68D391; }
  .idb-badge.pink   { background: rgba(237,100,166,.18); color: #F687B3; }
  .idb-badge.red    { background: rgba(252,129,129,.18); color: #FC8181; }
  .idb-badge.orange { background: rgba(246,173,85,.18); color: #F6AD55; }
  .idb-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: none; border-radius: 6px; cursor: pointer; font: 600 12px/1 -apple-system, "Segoe UI", Roboto, sans-serif; height: 30px; padding: 0 10px; flex-shrink: 0; text-decoration: none !important; }
  .idb-btn.primary { background: ${ACCENT}; color: #1A202C !important; }
  .idb-btn.primary:hover { background: #FFD633; }
  .idb-btn.ghost { background: #2D3748; color: #E2E8F0 !important; }
  .idb-btn.ghost:hover { background: #4A5568; }
  .idb-icon-btn { width: 30px; height: 30px; border-radius: 8px; background: #2D3748; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border: none; }
  .idb-icon-btn:hover { background: #4A5568; }
  .idb-icon-btn img { width: 20px; height: 20px; object-fit: contain; }
  .idb-tile { width: 92px; height: 92px; border-radius: 8px; background: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .idb-arrow { width: 28px; align-self: stretch; border-radius: 6px; background: transparent; border: none; color: #A0AEC0; font-size: 18px; cursor: pointer; }
  .idb-arrow:hover { background: #2D3748; color: #fff; }

  /* progress bar */
  .idb-bar { width: 450px; margin: 12px auto; background: #1A202C; border-radius: 10px; padding: 10px 12px; display: flex; align-items: center; gap: 12px; }
  .idb-bar > img { display: block; flex-shrink: 0; }
  .idb-error { color: #FEB2B2; }
  .idb-error a { color: #fff; }
  /* price toggle (switch below the progress bar) */
  .idb-bar-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .idb-toggle-row { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; padding: 0; margin-left: auto; cursor: pointer; color: #A0AEC0; font: 11px -apple-system, "Segoe UI", Roboto, sans-serif; }
  .idb-toggle-row:hover { color: #fff; }
  .idb-switch { width: 26px; height: 14px; border-radius: 999px; background: #4A5568; position: relative; flex-shrink: 0; transition: background .15s; }
  .idb-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 10px; height: 10px; border-radius: 50%; background: #fff; transition: left .15s; }
  .idb-toggle-row.on .idb-switch { background: ${ACCENT}; }
  .idb-toggle-row.on .idb-switch::after { left: 14px; }
  .idb-progress { height: 8px; border-radius: 999px; background: #2D3748; overflow: hidden; display: flex; flex: none; }
  .idb-progress > div { height: 100%; background: ${ACCENT}; border-radius: 999px; }
  .idb-progress > .idb-unreleased { margin-left: auto; border-radius: 0 999px 999px 0; background: repeating-linear-gradient(135deg, #4A5568 0 3px, #2D3748 3px 6px); }

  /* album grid */
  .content table img.fake-stamp { opacity: .25 !important; }
  .content table img[data-pos] { cursor: pointer; }
  .idb-cell { position: relative; }
  .idb-cell-selected { box-shadow: inset 0 0 0 3px ${ACCENT}; border-radius: 4px; }
  .idb-chip { position: absolute; left: 50%; bottom: 3px; transform: translateX(-50%); background: rgba(26,32,44,.92); color: #fff; font: 700 10px -apple-system, "Segoe UI", sans-serif; padding: 2px 6px; border-radius: 999px; white-space: nowrap; pointer-events: none; }
  .idb-chip.cheap { background: rgba(39,103,73,.95); }
  .idb-chip.none { background: rgba(113,128,150,.92); }
  .idb-chip.soon { background: rgba(74,85,104,.9); font-weight: 600; }
</style>`);

// ---------- helpers ---------- //
function rarityBadge(r) {
  r = Number(r);
  if (!r) return "";
  let label = `r${r}`, tone = "gray";
  if (r >= 75 && r <= 84) { label += " · uncommon"; tone = "green"; }
  else if (r >= 85 && r <= 89) { label += " · rare"; tone = "green"; }
  else if (r >= 90 && r <= 94) { label += " · very rare"; tone = "green"; }
  else if ((r >= 95 && r <= 98) || r === 100) { label += " · ultra rare"; tone = "green"; }
  else if (r === 99) { label += " · super rare"; tone = "green"; }
  else if (r >= 101 && r <= 104) { label += " · special"; tone = "pink"; }
  else if (r >= 105 && r <= 110) { label += " · MEGA RARE"; tone = "red"; }
  else if (r >= 111 && r <= 179) { tone = "red"; }
  else if (r === 180) { label += " · retired"; tone = "gray"; }
  else if (r === 200) { label += " · artifact"; tone = "red"; }
  return `<span class="idb-badge ${tone}">${label}</span>`;
}

// NC stamps have no NP price and stay out of the cost
const priceOf = (s) => (s.data && !s.data.isNC ? s.data.price?.value ?? null : null);

function priceText(s, short) {
  if (!s.data) return "";
  if (s.data.isNC) return "NC";
  const v = priceOf(s);
  if (!v) return "No price";
  return (short ? compact(v) : fmt(v)) + " NP";
}

const slugify = (text) => text.toString().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()
  .replace(/\s+/g, "-").replace(/[^\w-]+/g, "").replace(/--+/g, "-");

const SEARCHES = [
  { title: "Shop Wizard", img: "https://images.neopets.com/themes/h5/basic/images/shopwizard-icon.png", url: "https://www.neopets.com/shops/wizard.phtml?string=%s" },
  { title: "Trading Post", img: "https://images.neopets.com/themes/h5/basic/images/tradingpost-icon.png", url: "https://www.neopets.com/island/tradingpost.phtml?type=browse&criteria=item_exact&search_string=%s" },
  { title: "Auctions", img: "https://images.neopets.com/themes/h5/basic/images/auction-icon.png", url: "https://www.neopets.com/genie.phtml?type=process_genie&criteria=exact&auctiongenie=%s" },
  { title: "Safety Deposit Box", img: "https://images.neopets.com/themes/h5/basic/images/v3/safetydeposit-icon.svg", url: "https://www.neopets.com/safetydeposit.phtml?obj_name=%s&category=0" },
];

function searchButtons(name) {
  const ssw = hasPremium
    ? `<button class="idb-icon-btn idb-ssw" data-item="${name}" title="Super Shop Wizard"><img src="https://images.neopets.com/premium/shopwizard/ssw-icon.svg"></button>`
    : "";
  const links = SEARCHES
    .map((s) => `<a class="idb-icon-btn" target="_blank" title="${s.title}" href="${s.url.replace("%s", encodeURIComponent(name))}"><img src="${s.img}"></a>`)
    .join("");
  const idb = `<a class="idb-icon-btn" target="_blank" title="itemdb" href="https://itemdb.com.br/item/${slugify(name)}"><img src="https://itemdb.com.br/favicon.svg"></a>`;
  return ssw + links + idb;
}

function sswopen(item) {
  if ($(".sswdrop").hasClass("panel_hidden")) $("#sswmenu .imgmenu").click();
  if ($("#ssw-tabs-1").hasClass("ui-tabs-hide")) $("#button-new-search").click();
  $("#ssw-criteria").val("exact");
  $("#searchstr").val(item);
}

// Same import as the List Importer: owned stamps by image id, the album picks the checklist
function submitImport() {
  const items = {};
  stamps.forEach((s) => { if (s.owned && s.data) items[s.data.image_id] = 1; });

  const form = document.createElement("form");
  form.action = "https://itemdb.com.br/api/v1/lists/import-session";
  form.method = "POST";
  form.target = "_blank";
  form.style.display = "none";

  const fields = {
    itemDataJson: JSON.stringify(items),
    indexType: "image_id",
    source: "album-helper",
    meta: JSON.stringify({ albumID: Number(albumID) }),
  };

  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
  form.remove();
}

// ---------- data ---------- //
let stamps = [];
let selected = null;

function loadAlbum() {
  GM_xmlhttpRequest({
    method: "GET",
    url: "https://itemdb.com.br/api/v1/tools/album-helper?album_id=" + albumID,
    headers: { "Content-Type": "application/json" },
    onerror: showError,
    onload: (res) => {
      if (res.status !== 200) return showError(res);
      buildStamps(JSON.parse(res.responseText));
      render();
    },
  });
}

// friendly message by status (script-utils.js), where the progress bar would be
function showError(res) {
  console.error("[itemdb] Failed to fetch album data", res);
  const message = idb_getApiErrorMessage(res, { html: true });

  $(".idb-api-error-box").remove();
  ($youHave.length ? $youHave : $(".content table").first()).after(`
    <div class="idb idb-bar idb-api-error-box">
      <img src="${LOGO}" width="22" height="22">
      <div class="idb-col" style="flex:1; gap:2px">
        <span style="font-weight:700; color:#fff">Stamp Album Helper</span>
        <span class="idb-error">${message}</span>
      </div>
    </div>`);
}

function buildStamps(data) {
  stamps = [];
  $(".content table").first().find("img").each(function (i) {
    const position = i + 1;
    const $img = $(this);
    const owned = $img.attr("alt") !== "No Stamp";
    const entry = data[position];
    const s = { position, owned, data: entry ? entry.itemData : null, $img, $cell: $img.parent() };

    // missing stamps show the real image, faded (.fake-stamp is also what the List Importer skips)
    if (!owned && s.data) {
      $img.addClass("fake-stamp").attr({ src: s.data.image, alt: s.data.name, title: s.data.name });
    }

    $img.attr("data-pos", position);
    stamps.push(s);
  });
}

function stats() {
  const withData = stamps.filter((s) => s.data);
  const missing = withData.filter((s) => !s.owned);

  return {
    total: stamps.length,
    unreleased: stamps.length - withData.length,
    owned: stamps.filter((s) => s.owned).length,
    missing,
    cost: missing.reduce((sum, s) => sum + (priceOf(s) || 0), 0),
  };
}

// ---------- price toggle ---------- //
// on by default, saved per browser; hides the chips on the stamps (price and "Not out yet")
let showPrices = GM_getValue("showPrices", true);

function priceToggle() {
  const title = showPrices ? "Hide prices on the stamps" : "Show prices on the stamps";
  return `<button class="idb-toggle-row idb-price-toggle ${showPrices ? "on" : ""}" title="${title}" aria-pressed="${showPrices}">
      <span class="idb-switch"></span>Prices on stamps
    </button>`;
}

function togglePrices() {
  showPrices = !showPrices;
  GM_setValue("showPrices", showPrices);
  render();
}

// ---------- grid ---------- //
// price chip on each missing stamp (green = cheaper half), "Not out yet" on the empty slots
function gridOverlays() {
  const prices = stats().missing.map(priceOf).filter(Boolean).sort((a, b) => a - b);
  const cheapLimit = prices[Math.floor(prices.length / 2)] ?? 0;

  stamps.forEach((s) => {
    s.$cell.addClass("idb-cell").find(".idb-chip").remove();

    if (s.owned || !showPrices) return;
    if (s.data) {
      const p = priceOf(s);
      s.$cell.append(`<span class="idb-chip ${!p ? "none" : p <= cheapLimit ? "cheap" : ""}">${priceText(s, true)}</span>`);
    } else s.$cell.append('<span class="idb-chip soon">Not out yet</span>');
  });
}

// ---------- stamp panel ---------- //
function infoPanel(s) {
  const nav = (dir, label) =>
    `<button class="idb-arrow" data-dir="${dir}" title="${label} (arrow keys)">${dir < 0 ? "‹" : "›"}</button>`;

  const body = !s.data
    ? `<div class="idb-col" style="flex:1; justify-content:center">
        <span class="idb-title">Empty slot</span>
        <span class="idb-muted">Position ${s.position} · this stamp hasn't been released yet.</span>
      </div>`
    : `<div class="idb-col" style="flex:1">
        <a class="idb-title" href="https://itemdb.com.br/item/${s.data.slug}" target="_blank" style="text-decoration:none">${s.data.name}</a>
        <div class="idb-row" style="gap:6px; flex-wrap:wrap">
          ${rarityBadge(s.data.rarity)}
          <span class="idb-badge gray">#${s.position} of ${stamps.length}</span>
          ${s.owned ? '<span class="idb-badge green">✓ Collected</span>' : '<span class="idb-badge red">Missing</span>'}
        </div>
        <div class="idb-row" style="gap:8px">
          <a href="https://itemdb.com.br/item/${s.data.slug}" target="_blank" style="text-decoration:none; font-size:18px; font-weight:700; color:${priceOf(s) ? "#fff" : "#A0AEC0"}">${priceText(s)}</a>
          ${s.data.price?.inflated ? '<span class="idb-badge orange" title="Price may be inflated">⚠ inflated</span>' : ""}
        </div>
        <div class="idb-row" style="gap:6px; flex-wrap:wrap">${searchButtons(s.data.name)}</div>
      </div>`;

  return `<div class="idb idb-card idb-info"><div class="idb-row" style="align-items:stretch">
      ${nav(-1, "Previous")}
      <div class="idb-tile"><img src="${s.data ? s.data.image : s.$img.attr("src")}" width="80" height="80" style="${s.owned || !s.data ? "" : "opacity:.45"}"></div>
      ${body}
      ${nav(1, "Next")}
    </div></div>`;
}

function select(position) {
  const s = stamps.find((x) => x.position === position);
  if (!s) return;

  selected = position;
  $(".content table").first().find("td").removeClass("idb-cell-selected");
  s.$cell.addClass("idb-cell-selected");
  $("#idb-info-slot").html(infoPanel(s));
}

function step(dir) {
  if (selected == null) return;
  const n = stamps.length;
  select(((selected - 1 + dir + n) % n) + 1);
}

// ---------- progress bar ---------- //
function progressBar() {
  const st = stats();
  const pct = (n) => (n / st.total) * 100;
  const status = st.missing.length
    ? `${compact(st.cost)} NP to complete`
    : st.unreleased
      ? `<b style="color:${ACCENT}">All released stamps!</b>`
      : `<b style="color:${ACCENT}">Complete!</b>`;
  const importButton = isOwnAlbum
    ? `<button class="idb-btn primary idb-import" title="Import to my itemdb checklist"><img src="${LOGO}" width="16"> Import</button>`
    : "";

  return `<div class="idb idb-bar">
    <img src="${LOGO}" width="22" height="22">
    <div class="idb-col" style="flex:1; gap:6px">
      <div class="idb-row" style="justify-content:space-between">
        <span style="font-weight:700; color:#fff">${st.owned} / ${st.total} collected</span>
        <span class="idb-muted">${status}</span>
      </div>
      <div class="idb-progress" title="${st.unreleased ? `${st.unreleased} not released yet` : ""}">
        <div style="width:${pct(st.owned)}%"></div>
        ${st.unreleased ? `<div class="idb-unreleased" style="width:${pct(st.unreleased)}%"></div>` : ""}
      </div>
      <div class="idb-bar-footer">
        ${st.unreleased ? `<span class="idb-hint">${st.unreleased} stamp${st.unreleased > 1 ? "s" : ""} not released yet</span>` : ""}
        ${priceToggle()}
      </div>
    </div>
    ${importButton}
    <a class="idb-btn ghost" href="${albumLink}" target="_blank" title="View on itemdb">→</a>
  </div>`;
}

// ---------- render ---------- //
// everything goes below Neopets' "You have N stamps on this page!" (below the album when it's missing):
// stamp panel, progress bar, SSW tip
function render() {
  const $album = $(".content table").first();
  $(".idb").remove();
  $("#idb-info-slot").remove();

  const $anchor = $youHave.length ? $youHave : $album;
  $anchor.after('<div id="idb-info-slot"></div>');
  $("#idb-info-slot").after(progressBar());
  if (hasPremium)
    $(".idb-bar").after('<div class="idb idb-hint" style="text-align:center; margin-top:6px">Double-click a stamp to search it on the Super Shop Wizard</div>');

  gridOverlays();
  if (selected) select(selected);
}

// ---------- events ---------- //
$("body")
  .on("click", ".content table img[data-pos]", function () {
    select(Number($(this).attr("data-pos")));
  })
  .on("dblclick", ".content table img[data-pos]", function () {
    const s = stamps.find((x) => x.position === Number($(this).attr("data-pos")));
    if (hasPremium && s?.data) sswopen(s.data.name);
  })
  .on("click", ".idb-arrow", function () { step(Number($(this).attr("data-dir"))); })
  .on("click", ".idb-ssw", function () { sswopen($(this).attr("data-item")); })
  .on("click", ".idb-import", submitImport)
  .on("click", ".idb-price-toggle", togglePrices);

$(document).on("keydown", (e) => {
  if (selected == null || $(e.target).is("input, textarea, select")) return;
  if (e.key === "ArrowLeft") step(-1);
  if (e.key === "ArrowRight") step(1);
});

loadAlbum();
