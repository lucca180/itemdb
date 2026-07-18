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

// ---------------------------------------------------------------------------
// API error helpers
// Turn an API response into a friendly, user-facing message based on the HTTP
// status code. Works with both the GM_xmlhttpRequest/GM.xmlHttpRequest response
// object (res.status, res.responseHeaders) and a fetch Response (res.headers).
// ---------------------------------------------------------------------------

const idb_TROUBLESHOOT_URL = 'https://itemdb.com.br/tools/troubleshooting';

// Friendly message templates by HTTP status code.
// Templates may contain the {retryAfter} and {troubleshoot} placeholders.
const idb_apiStatusMessages = {
  0: "Couldn't connect. Check your internet connection and try again.",
  400: 'Invalid request.',
  401: "Your session may be invalid or expired. See {troubleshoot} for help.",
  403: "You don't have permission to do this.",
  404: "The requested resource wasn't found.",
  405: "This action isn't allowed.",
  429: 'Request limit reached. Please wait {retryAfter} and try again.',
  500: 'Something went wrong on the server. Please try again in a moment.',
};

// Turns a Retry-After value (in seconds) into a readable string like
// "5 minutes" or "30 seconds". Returns null when there's nothing to show.
function idb_formatRetryAfter(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return null;

  if (total < 60) {
    const s = Math.round(total);
    return `${s} ${s === 1 ? 'second' : 'seconds'}`;
  }

  const minutes = Math.round(total / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  const hours = Math.round(total / 3600);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

// Reads the Retry-After header from either a GM response (raw header string)
// or a fetch Response (Headers object). Returns the value in seconds or null.
function idb_getRetryAfterSeconds(res) {
  if (!res) return null;

  try {
    // fetch Response
    if (res.headers && typeof res.headers.get === 'function') {
      const value = res.headers.get('Retry-After');
      return value != null ? Number(value) : null;
    }

    // GM_xmlhttpRequest / GM.xmlHttpRequest: raw header string
    if (typeof res.responseHeaders === 'string') {
      const match = res.responseHeaders.match(/^retry-after:\s*(.+)$/im);
      if (match) return Number(match[1].trim());
    }
  } catch {
    return null;
  }

  return null;
}

// Normalizes any supported response into a small, predictable object.
function idb_parseApiError(res) {
  let status = 0;
  try {
    if (res && typeof res.status === 'number') status = res.status;
  } catch {
    status = 0;
  }

  const retryAfterSeconds = idb_getRetryAfterSeconds(res);
  const retryAfter = idb_formatRetryAfter(retryAfterSeconds);

  return {
    status,
    retryAfterSeconds,
    retryAfter,
    isRateLimited: status === 429,
  };
}

// Returns a friendly, user-facing message for an API error response.
// options: { html = false, fallback }
//  - html: when true, the troubleshooting link is rendered as an <a> tag,
//    otherwise it's plain text with the URL in parentheses.
//  - fallback: message to use when the status has no specific template.
function idb_getApiErrorMessage(res, options) {
  const { html = false, fallback } = options || {};
  const { status, retryAfter } = idb_parseApiError(res);

  let template = idb_apiStatusMessages[status];
  if (!template && status >= 500 && status <= 599) {
    template = idb_apiStatusMessages[500];
  }
  if (!template) {
    template = fallback || 'Something went wrong. Please try again.';
  }

  // Resolve the retry time. When there's no Retry-After we fall back to a
  // generic "later" phrasing instead of leaving an empty wait time.
  let message;
  if (retryAfter) {
    message = template.replace('{retryAfter}', retryAfter);
  } else {
    message = template
      .replace('Please wait {retryAfter} and try again.', 'Please try again later.')
      .replace('{retryAfter}', 'a moment');
  }

  const troubleshoot = html
    ? `<a href="${idb_TROUBLESHOOT_URL}" target="_blank">the troubleshooting page</a>`
    : `the troubleshooting page (${idb_TROUBLESHOOT_URL})`;
  message = message.replace('{troubleshoot}', troubleshoot);

  return message;
}

// Convenience predicates.
function idb_isRateLimited(res) {
  return idb_parseApiError(res).status === 429;
}

function idb_isAuthError(res) {
  const { status } = idb_parseApiError(res);
  return status === 401 || status === 403;
}

// this is used to convert shop ids to item categories
const idb_shopIDToCategory={'1':'food','2':'magic item','3':'toy','4':'clothes','5':'grooming','7':'book','8':'collectable card','9':'battle magic','10':'defence magic','12':'gardening','13':'medicine','14':'candy','15':'baked','16':'healthy food','17':'gift','18':'smoothie','20':'tropical food','21':'island merchandise','22':'space food','23':'space battle','24':'space defence','25':'petpet','26':'robot petpet','27':'aquatic petpet','30':'spooky food','31':'spooky petpet','34':'coffee','35':'slushie','36':'ice crystal','37':'snow food','38':'faerie book','39':'faerie food','40':'faerie petpet','41':'furniture','42':'tyrannian food','43':'tyrannian furniture','44':'tyrannian petpet','45':'tyrannian weaponry','46':'hot dog','47':'pizza','48':'usuki doll','49':'desert food','50':'desert petpet','51':'desert scroll','53':'school','54':'desert weapon','55':'desert pottery','56':'medieval food','57':'medieval petpet','58':'stamp','59':'haunted weaponry','60':'spooky furniture','61':'wintery petpet','62':'jelly food','63':'refreshments','66':'kiko lake food','67':'kiko lake carpentry','68':'collectibles','69':'petpet supplies','70':'booktastic book','71':'kreludan furniture','72':'kreludan food','73':'meridell potion','74':'darigan toy','75':'faerie furniture','76':'roo island merchandise','77':'brightvale books','78':'brightvale scroll','79':'brightvale windows','80':'brightvale armour','81':'brightvale fruit','82':'brightvale motes','83':'brightvale potions','84':'instrument','85':'medical cures','86':'sea shells','87':'maractite weaponry','88':'maraquan petpets','89':'geraptiku petpet','90':'qasalan food','91':'qasalan weaponry','92':'qasalan tablets','93':'faerie weapon shop','94':'altadorian armour','95':'altadorian food','96':'altadorian magic','97':'altadorian petpets','98':'plushies','100':'wonderous weaponry','101':'exotic foods','102':'remarkable restoratives','103':'fanciful fauna','104':'neovian antiques','105':'neovian pastries','106':'neovian press','107':'neovian attire','108':'mystical surroundings','110':"lampwyck's lights fantastic",'111':"cog's togs",'112':'molten morsels','113':'moltaran petpets','114':'moltaran books','116':'springy things','117':'ugga shinies',};
