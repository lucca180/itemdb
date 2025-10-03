export const LATEST_VERSIONS_CODE = {
  itemdb_script: 196,
  itemdb_restock: 201,
  itemdb_sdbPricer: 154,
};

export const showScriptCTA = (): false | 'notFound' | 'outdated' => {
  if (!window) return false;

  const hasScript = !!(window.itemdb_restock || window.itemdb_script || window.itemdb_sdbPricer);

  if (!hasScript) return false;

  if (hasScript && !window.itemdb_script) {
    return 'notFound';
  }

  if (
    window.itemdb_script &&
    window.itemdb_script.versionCode < LATEST_VERSIONS_CODE.itemdb_script
  ) {
    return 'outdated';
  }

  return false;
};

export const getScriptStatus = () => {
  try {
    return _getScriptStatus();
  } catch (error) {
    console.error('Error getting script status:', error);
    return null;
  }
};

const _getScriptStatus = () => {
  if (!window) return null;
  const hasScript = !!(window.itemdb_restock || window.itemdb_script || window.itemdb_sdbPricer);

  if (!hasScript) return null;

  const scriptStatus = {
    itemdb_script: {
      name: 'Item Data Extractor',
      status: 'notFound',
      versionCode: 0,
      version: window.itemdb_script?.version || '',
      link: 'https://github.com/lucca180/itemdb/raw/main/userscripts/itemDataExtractor.user.js',
    },
    itemdb_restock: {
      name: 'Restock Tracker',
      status: 'notFound',
      versionCode: 0,
      version: window.itemdb_restock?.version || '',
      link: 'https://github.com/lucca180/itemdb/raw/main/userscripts/restockTracker.user.js',
    },
    itemdb_sdbPricer: {
      name: 'SDB Pricer',
      status: 'notFound',
      versionCode: 0,
      version: window.itemdb_sdbPricer?.version || '',
      link: 'https://github.com/lucca180/itemdb/raw/main/userscripts/sdbPricer.user.js',
    },
  };

  if (window.itemdb_script) {
    scriptStatus.itemdb_script.status =
      window.itemdb_script.versionCode >= LATEST_VERSIONS_CODE.itemdb_script ? 'ok' : 'outdated';
  }

  if (window.itemdb_restock) {
    scriptStatus.itemdb_restock.status =
      (window.itemdb_restock.versionCode ?? 0) >= LATEST_VERSIONS_CODE.itemdb_restock
        ? 'ok'
        : 'outdated';
  }

  if (window.itemdb_sdbPricer) {
    scriptStatus.itemdb_sdbPricer.status =
      window.itemdb_sdbPricer.versionCode >= LATEST_VERSIONS_CODE.itemdb_sdbPricer
        ? 'ok'
        : 'outdated';
  }

  return scriptStatus;
};
