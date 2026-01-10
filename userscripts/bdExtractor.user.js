// ==UserScript==
// @name         itemdb - Battledome Extractor
// @version      0.0.1
// @author       itemdb
// @namespace    itemdb
// @description  Feeds itemdb.com.br with neopets battledome data
// @website      https://itemdb.com.br
// @match        *://*.neopets.com/dome/*
// @match        *://*.itemdb.com.br/*
// @icon         https://itemdb.com.br/favicon.ico
// @connect      itemdb.com.br
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        unsafeWindow
// @run-at       document-start
// @noframes
// ==/UserScript==

const script_info = {
  version: GM_info.script.version,
  versionCode: Number(GM_info.script.version.replaceAll(".", ""))
}

// function to check if the current url contains a word
function URLHas(string) {
  const hasWord = window.location.href.includes(string);
  return hasWord;
}

const itemdb_script = function() {
  if(typeof $ === 'undefined') return;

  // check the page language
  if(nl) {
    GM_setValue('pageLang', nl);
  }

  if (URLHas('idb_clear')) {
    GM_deleteValue('itemdb_battleData');
    GM_deleteValue('itemdb_petInfo');
    console.log('itemdb: Cleared stored BD data');
  }


  // ------ Pet Data ------ //
  const petInfo = GM_getValue('itemdb_petInfo', {});
  
  function handlePetData() {
    $('.petInfoBox').each(function() {
      const petName = $(this).attr('data-name');
    
      const maxHP = $(this).find('.row1.leftValue').text().trim().split('/')[1].trim();
      const agility = $(this).find('.row1.rightValue').text().trim();

      const strength = $(this).find('.row2.leftValue').text().trim();
      const defense = $(this).find('.row2.rightValue').text().trim();

      petInfo[petName] = {
        maxHP: Number(maxHP),
        agility: Number(agility),
        strength: Number(strength),
        defense: Number(defense),
      };
    })

    GM_setValue('itemdb_petInfo', petInfo);
    console.log('itemdb: Pet data updated', petInfo);
  }


  // ------ Fight Data ------ //
  let battleData = GM_getValue('itemdb_battleData', {});

  const p1ItemsSet = new Set(battleData?.p1?.items || []);
  const p2ItemsSet = new Set();
  const p1ItemUses = new Map();

  const allAbilities = {
    "1": "Static Cling",
    "2": "An Icicle",
    "3": "Healing Fire",
    "10": "Halitosis",
    "11": "Drizzle",
    "12": "Bandage",
    "13": "Meditate",
    "14": "Shade",
    "15": "Cranky",
    "16": "Meh",
    "17": "Positive Thinking",
    "18": "Sear",
    "19": "Irritable Minions",
    "20": "Throw Pillows",
    "21": "Lens Flare",
    "22": "Shhhhhhhhh...",
    "23": "Shroud",
    "24": "Float",
    "25": "Burrow",
    "26": "Tempest",
    "27": "Snowager's Breath",
    "28": "Warlock's Rage",
    "29": "Rejuvenate",
    "30": "Drain Life",
    "31": "Reflect",
    "32": "Rally Cry",
    "33": "Adrenaline Rush",
    "34": "Meepit Stampede",
    "35": "Summon Monoceraptor",
    "37": "Esophagor Stench"
  };

  function handleBDAction() {
    $(document).ajaxSuccess((event, xhr, settings) => {
      if (!settings.url.includes('arena.php')) return;
      try{
        const response = JSON.parse(xhr.responseText);
        const parsedResponse = parseBattleResponse(response);

        if(response.battle.battleid !== battleData.battleId) {
          battleData = {
            battleId: response.battle.battleid,
            result: null,
            roundLogs: [],
            attacks: [],
            p1: {},
            p2: {},
            difficulty: response.player2difficulty ?? null,
          };
          
          battleData.p1.name = $("#p1name").text().trim();
          battleData.p2.name = $("#p2name").text().trim();

          battleData.p1.stats = petInfo[battleData.p1.name] || {};

          if(response.p1.fight_step === 0) {
            battleData.p1.items = Array.from(p1ItemsSet);
          }

          const t = Number($('#p1hgreen')[0].style.top.replace('px',''));
          battleData.p1.fullHP = battleData.p1.stats.maxHP ?? Math.round((456 * response.p1.hp) / (t + 456));
          
          const t2 = Number($('#p2hgreen')[0].style.top.replace('px',''));
          battleData.p2.fullHP = Math.round((456 * response.p2.hp) / (t2 + 456));
        }

        battleData.attacks.push(...parsedResponse.attacks);
        battleData.roundLogs.push(parsedResponse.roundLog);

        // battle ended
        if(response.battle.status === 2) {
          const winner = response.battle.winner;
          if(winner < 3) battleData.result = winner === 1 ? 'win' : 'lose';
          else battleData.result = 'draw';

          if(response.battle.prizes) {
            battleData.prizes = response.battle.prizes.map(prize => ({
              type: prize.type,
              amount: prize.value ?? 1,
              item_id: prize.oii ?? null,
            }));
          }

          console.log('Battle ended, submitting data...', battleData);
          submitBattle(battleData);
        }

        GM_setValue('itemdb_battleData', battleData);
        console.log('itemdb: BD data updated', battleData);
      } catch(e) {
        console.error('itemdb: Failed to parse BD response', e);
      }
    })
  }

  function parseBattleResponse(response) {
    const parser = new DOMParser();

    const doc = parser.parseFromString(
      `<table>${response.log}</table>`,
      'text/html'
    );

    const p1Items = [
      docFromHTML(response.p1.items).querySelectorAll('img'), 
      docFromHTML(response.p1.useditems || '').querySelectorAll('img')
    ];

    const p1UsedItems = new Map();
    const p2UsedItems = new Map();
    const p1CurrentItems = new Set();

    p1Items.map((items, i) => {
      Array.from(items).map(img => {
        const name = img.title.trim() || img.alt.trim();

        p1ItemsSet.add(name);
        
        if(i === 1) {
          p1UsedItems.set(name, 0);
          const uses = p1ItemUses.get(name) || 0;
          p1ItemUses.set(name, uses + 1);
        }
        else p1CurrentItems.add(name);
      });
    })
    

    Array.from(
        docFromHTML(response.p2.useditems || '')
          .querySelectorAll('img')
      ).map(img => {
        const name = img.alt.trim();

         if(!name) return;

        p2ItemsSet.add(name);
        p2UsedItems.set(name, 0)
      });

    const rows = Array.from(doc.querySelectorAll('tr'));

    const attacks = [];

    const p1Abilities = new Map();
    $('#p1ability td').each(function(){
      const name = $(this).attr('title')?.trim();
      const id = $(this).find('.ability').attr('data-ability');
      if(name && id) p1Abilities.set(id, name);
    });

    const p1UsedAbility = allAbilities[String(response.p1.a)];
    const p2UsedAbility = allAbilities[String(response.p2.a?.id)];

    const p1Dmg = new Map();
    const p2Dmg = new Map();

    for (const row of rows) {
      const msgCell = row.querySelector('td.msg');
      const text = msgCell?.textContent?.trim();
      if (!msgCell || !text) continue;
      
      let player = null;
      
      let weapon = p1UsedItems.keys().find(name => text.includes(name));
      
      if(weapon && !p2UsedItems.has(weapon)) {
        player = 'p1';
        p1UsedItems.set(weapon, (p1UsedItems.get(weapon) || 0) + 1);
      }

      if(!weapon) {
        weapon = p2UsedItems.keys().find(name => text.includes(name));
        p2UsedItems.set(weapon, (p2UsedItems.get(weapon) || 0) + 1);
        if(weapon) player = 'p2';
      }

      let maxUses = 0;

      if(player === 'p1' && weapon) {
        if(!p1CurrentItems.has(weapon)) {
          maxUses = p1ItemUses.get(weapon) || 0;
        }
      }

      let isAbility = null;
      if(!weapon) {
        weapon = text.includes(p1UsedAbility) ? p1UsedAbility : null;
        if(weapon) {
          isAbility = true;
          player = 'p1';
        }

        if(!weapon) {
          weapon = text.includes(p2UsedAbility) ? p2UsedAbility : null;
          if(weapon) {
            isAbility = true;
            player = 'p2';
          }
        }
      }

      const damage = Array.from(
        row.querySelectorAll('.icon_cnt')
      ).map(cnt => {
        const icon = cnt.querySelector('.icon');
        const amountText = cnt.textContent.match(/x\s*(\d+)/i) || cnt.textContent.match(/\d+/i);
        const amount = amountText ? Number(amountText?.at?.(-1)) : 1;
        const type = ['hp', 'defend'].includes(Array.from(icon?.classList)?.at?.(-1)) ? Array.from(icon?.classList)?.at?.(-1) : 'attack';
        
        if(!player) {
          if(!!row.querySelector('.flicon.p1 > div')) {
            player = type === 'attack' ? 'p2' : 'p1';
          }

          if(!!row.querySelector('.flicon.p2 > div')) {
            player = type === 'attack' ? 'p1' : 'p2';
          }
        }

        const report = {
          type: type,
          label: icon?.title || type,
          amount: amount ?? 1,
        }

        if(type === 'hp' && player && amountText) {
          const fullHealth = player === 'p1' ? battleData.p1.fullHP : battleData.p2.fullHP;
          const lastLog = battleData.roundLogs.at(-1);
          const hpBefore = player === 'p1' ? lastLog.p1.hp : lastLog.p2.hp;
          const lostHP = fullHealth - hpBefore;
          
          const hpHealed = amount;
          const healedPercent = Math.round((hpHealed / lostHP) * 100);
          
          const playerHP = player === 'p1' ? response.p1.hp : response.p2.hp;
          const playerDmg = player === 'p1' ? response.p1.last_damage : response.p2.last_damage;

          const isOverHeal = fullHealth - playerDmg < playerHP;

          report.healInfo = {
            percent: healedPercent,
            isOverHeal,
          }
        }

        if(!['hp', 'defend'].includes(type) && player && icon?.title) {
          const dmgMap = player === 'p1' ? p2Dmg : p1Dmg;
          const iconName = icon.title;

          const prevDmg = dmgMap.get(iconName) || 0;

          dmgMap.set(iconName, prevDmg + (amount ?? 1));
        }

        if(type === 'defend' && player) {
          const dmgMap = player === 'p1' ? p1Dmg : p2Dmg;
          const iconName = icon.title;

          const prevDmg = dmgMap.get(iconName) || 1;
          const percentDefense = Math.round((amount/prevDmg) * 100);
          
          report.defenseInfo = {
            prevDmg: prevDmg,
            percent: percentDefense,
          }
        }

        return report
      });

      attacks.push({
        round: response.p1.fight_step,
        text,
        player,
        weapon,
        isAbility,
        weaponMaxUses: maxUses || null,
        damage
      });
    }
    
    // unprocessed attacks 
    ['p1','p2'].forEach(player => {
      const usedItems = player === 'p1' ? p1UsedItems : p2UsedItems;
      // remove from used items those with non zero uses
      for(const [name, uses] of usedItems.entries()) {
        if(uses > 0) usedItems.delete(name);
      }

      const unprocessed = attacks.filter(atk => !atk.weapon && atk.player === player);
      if(unprocessed.length === 1 && usedItems.size === 1) {
        const weapon = usedItems.keys().next().value;
        unprocessed[0].weapon = weapon;
        console.log('processed unassigned weapon:', weapon, player);

        if(player === 'p1' && weapon) {
          if(!p1CurrentItems.has(weapon)) {
            unprocessed[0].weaponMaxUses = p1ItemUses.get(weapon) || null;
          }
        }
      }
    });
    const freezingAbilityIds = [21, 28];

    const roundLog = {
      round: response.p1.fight_step,
      p1: {
        hp: response.p1.hp,
        isFrozen: response.p1.isFrozen,
        usedFreezingAbility: freezingAbilityIds.includes(response.p1.a),
      },
      p2: {
        hp: response.p2.hp,
        isFrozen: response.p2.isFrozen,
        usedFreezingAbility: freezingAbilityIds.includes(response.p2.a?.id),
      }
    }
     
    return {attacks, roundLog};
  }

  function docFromHTML(html) {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  // ------------- //

  // Here we check if the page has the url we want and then call the respective function
  // and we also check if you have SSW so we can call the SSW handler

  if( URLHas('dome/arena.phtml')) handleBDAction();
  if( URLHas('dome/fight.phtml')) handlePetData();

  // ----------- //

  // Here we send the data to the server
  async function submitBattle(battleData) {
    if(checkTranslation()) return;
    
    const pageLang = GM_getValue('pageLang', 'unknown');
    
    if(pageLang !== nl || nl !== 'en' || pageLang !== 'en') 
      return console.error('[itemdb] Language error');

    // anonymize player name
    battleData.p1.name = 'anonymized'

    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://itemdb.com.br/api/v1/bd',
      // url: 'http://localhost:3000/api/v1/bd',
      headers: {
        'Content-Type': 'application/json',
        'itemdb-version': script_info.versionCode,
      },
      data: JSON.stringify(battleData),
      onload: function (res) {
        if (res.status === 200) {
          console.log(`[itemdb] battle data sent`);
        } else {
          console.error('[itemdb] submitBattle error:', res, battleData);
        }
      },
    })
  }


  // ----------- //

  // this function is used to detect if the page is translated using google translate or similar
  function checkTranslation() {
    return !!document.querySelector(
      "html.translated-ltr, html.translated-rtl, ya-tr-span, *[_msttexthash], *[x-bergamot-translated]"
    );
  }
}

// only runs the script if the page is fully loaded
addEventListener("DOMContentLoaded", itemdb_script);

// for troubleshooting use
(unsafeWindow ?? window).itemdb_battle = script_info;