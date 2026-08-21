export type PublicDataExport = {
  name: string;
  description: string;
  date: string;
  size: string;
  format: string;
  link: string;
  update?: string;
};

const s3ExportMap = {
  items: {
    name: 'Item Data',
    description:
      "A dump of some items from itemdb's database. Does not include prices or other data. Useful for setting up your own itemdb instance or for data analysis.",
    format: 'gzip, sql',
    update: 'Every Month',
  },
  itemcolor: {
    name: 'Item Colors',
    description:
      "A dump of some items from itemdb's database. Useful for setting up your own itemdb instance or for data analysis.",
    format: 'gzip, sql',
    update: 'Every Month',
  },
  itemprices: {
    name: 'Item Prices',
    description:
      "A dump of some item prices from itemdb's database. Useful for setting up your own itemdb instance or for data analysis.",
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
    link: `/api/public-data/${(data.Key ?? '').split('/').map(encodeURIComponent).join('/')}`,
    update: mappedData.update,
  };
}
