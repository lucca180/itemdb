/*
  This file contains some utility functions for itemdb userscripts
*/

// For some pages, we need to watch if we receive the item data from the neo server
// We only watch requests that contains the data from items. Everything else is ignored.

const originalOpen = window.XMLHttpRequest.prototype.open;
const originalFetch = window.fetch;

function idb_watchItemRequests(paramName){
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener("load", function() {
      if (this.response.includes("{")){
        const requestData = JSON.parse(this.response);
        // check if the request contains the item data we want, if not we ignore it
        if (typeof requestData[paramName] === 'undefined') return;
        resItemData.push(requestData);
      }
    })
   
    originalOpen.apply(this, arguments);
  }
}

function idb_registerFetchWatcher({ match, eventName }) {
  const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
  if (!targetWindow.__idbFetchWatchers) {
    targetWindow.__idbFetchWatchers = [];
  }

  if (!targetWindow.__idbFetchPatched) {
    targetWindow.__idbFetchPatched = true;

    const originalFetch = targetWindow.fetch;

    targetWindow.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const clonedResponse = response.clone();

      let responseText = '';
      try {
        responseText = await clonedResponse.text();
      } catch {
        return response;
      }

      let requestData;
      try {
        requestData = JSON.parse(responseText);
      } catch {
        return response;
      }

      for (const watcher of targetWindow.__idbFetchWatchers) {
        try {
          if (watcher.match({ args, requestData, response })) {
            document.dispatchEvent(
              new CustomEvent(watcher.eventName, { detail: requestData })
            );
          }
        } catch {}
      }

      return response;
    };
  }

  targetWindow.__idbFetchWatchers.push({ match, eventName });
}

// this is used to convert shop ids to item categories
const idb_shopIDToCategory={'1':'food','2':'magic item','3':'toy','4':'clothes','5':'grooming','7':'book','8':'collectable card','9':'battle magic','10':'defence magic','12':'gardening','13':'medicine','14':'candy','15':'baked','16':'healthy food','17':'gift','18':'smoothie','20':'tropical food','21':'island merchandise','22':'space food','23':'space battle','24':'space defence','25':'petpet','26':'robot petpet','27':'aquatic petpet','30':'spooky food','31':'spooky petpet','34':'coffee','35':'slushie','36':'ice crystal','37':'snow food','38':'faerie book','39':'faerie food','40':'faerie petpet','41':'furniture','42':'tyrannian food','43':'tyrannian furniture','44':'tyrannian petpet','45':'tyrannian weaponry','46':'hot dog','47':'pizza','48':'usuki doll','49':'desert food','50':'desert petpet','51':'desert scroll','53':'school','54':'desert weapon','55':'desert pottery','56':'medieval food','57':'medieval petpet','58':'stamp','59':'haunted weaponry','60':'spooky furniture','61':'wintery petpet','62':'jelly food','63':'refreshments','66':'kiko lake food','67':'kiko lake carpentry','68':'collectibles','69':'petpet supplies','70':'booktastic book','71':'kreludan furniture','72':'kreludan food','73':'meridell potion','74':'darigan toy','75':'faerie furniture','76':'roo island merchandise','77':'brightvale books','78':'brightvale scroll','79':'brightvale windows','80':'brightvale armour','81':'brightvale fruit','82':'brightvale motes','83':'brightvale potions','84':'instrument','85':'medical cures','86':'sea shells','87':'maractite weaponry','88':'maraquan petpets','89':'geraptiku petpet','90':'qasalan food','91':'qasalan weaponry','92':'qasalan tablets','93':'faerie weapon shop','94':'altadorian armour','95':'altadorian food','96':'altadorian magic','97':'altadorian petpets','98':'plushies','100':'wonderous weaponry','101':'exotic foods','102':'remarkable restoratives','103':'fanciful fauna','104':'neovian antiques','105':'neovian pastries','106':'neovian press','107':'neovian attire','108':'mystical surroundings','110':"lampwyck's lights fantastic",'111':"cog's togs",'112':'molten morsels','113':'moltaran petpets','114':'moltaran books','116':'springy things','117':'ugga shinies',};
