import React from 'react';

export const LATEST_VERSIONS_CODE = {
  itemdb_script: 1100,
  itemdb_restock: 203,
  itemdb_sdbPricer: 154,
  itemdb_albumHelper: 102,
  itemdb_listImporter: 124,
};

export const DETECTABLE_SCRIPTS = [
  'Item Data Extractor',
  'Restock Tracker',
  'SDB Pricer',
  'Album Helper',
  'List Importer',
] as const;

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
  const hasScript = !!(
    window.itemdb_restock ||
    window.itemdb_script ||
    window.itemdb_sdbPricer ||
    window.itemdb_albumHelper ||
    window.itemdb_listImporter
  );

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
    itemdb_albumHelper: {
      name: 'Album Helper',
      status: 'notFound',
      versionCode: 0,
      version: window.itemdb_albumHelper?.version || '',
      link: 'https://github.com/lucca180/itemdb/raw/main/userscripts/albumHelper.user.js',
    },
    itemdb_listImporter: {
      name: 'List Importer',
      status: 'notFound',
      versionCode: 0,
      version: window.itemdb_listImporter?.version || '',
      link: 'https://github.com/lucca180/itemdb/raw/main/userscripts/listImporter.user.js',
    },
  };

  const keys = Object.keys(scriptStatus) as (keyof typeof scriptStatus)[];

  for (const key of keys) {
    const script = (window as any)[key];
    if (script) {
      scriptStatus[key].status =
        script.versionCode >= LATEST_VERSIONS_CODE[key] ? 'ok' : 'outdated';
    }
  }

  return scriptStatus;
};

export const useScriptStatus = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [scriptStatus, setScriptStatus] = React.useState<ReturnType<typeof getScriptStatus>>(null);

  React.useEffect(() => {
    const status = getScriptStatus();
    setScriptStatus(status);
    setIsLoading(false);
  }, []);

  return { isLoading, scriptStatus };
};
