export type PublicDataExport = {
  name: string;
  description: string;
  date: string;
  size: string;
  format: string;
  link: string;
  update?: string;
};

export const staticPublicDataExports: PublicDataExport[] = [
  {
    name: "itemdb's db dump",
    description:
      "A dump of itemdb's database, including items, colors and prices. Useful if you want to run your own clone of itemdb.",
    date: '2025-08-20',
    size: '97.5MB',
    format: 'zip, sql',
    link: 'https://cdn.itemdb.com.br/raw/itemdb-dump-2025-08-20.zip',
  },
  {
    name: "itemdb's Restock History",
    description: "A dump of all restocks reports in itemdb's database.",
    date: '2024-04-14',
    size: '130MB',
    format: 'zip, csv',
    link: 'https://firebasestorage.googleapis.com/v0/b/itemdb-1db58.appspot.com/o/raw%2Fitemdb_restockHistory_20240414.zip?alt=media&token=c1606c35-e8d1-4b23-9158-5aa374101409',
  },
];

const s3ExportMap = {
  items: {
    name: 'Item Data',
    description:
      "A dump of all items in itemdb's database. Does not include prices or other data. Useful for setting up your own itemdb instance or for data analysis.",
    format: 'gzip, sql',
    update: 'Every Month',
  },
  itemcolor: {
    name: 'Item Colors',
    description:
      "A dump of all item colors in itemdb's database. Useful for setting up your own itemdb instance or for data analysis.",
    format: 'gzip, sql',
    update: 'Every Month',
  },
  itemprices: {
    name: 'Item Prices',
    description:
      "A dump of all price history in itemdb's database. Useful for setting up your own itemdb instance or for data analysis.",
    format: 'gzip, sql',
    update: 'Every 3 Months',
  },
} as const;

export function mapS3ObjectToExport(data: {
  Key: string | undefined;
  LastModified: Date | undefined;
  Size: number | undefined;
}): PublicDataExport | null {
  const key = data.Key?.split('/').pop()?.split('.')[0].toLowerCase() ?? 'unknown';
  const mappedData = s3ExportMap[key as keyof typeof s3ExportMap];
  if (!mappedData) return null;

  return {
    name: mappedData.name,
    description: mappedData.description,
    format: mappedData.format,
    size: data.Size ? `${(data.Size / (1024 * 1024)).toFixed(2)}MB` : 'unknown',
    date: data.LastModified?.toISOString().split('T')[0] ?? 'unknown',
    link: `https://cdn.itemdb.com.br/${data.Key}`,
    update: mappedData.update,
  };
}
