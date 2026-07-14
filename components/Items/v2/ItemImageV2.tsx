'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import type { ItemV2For } from '@types';

type ImageProps = React.ComponentProps<typeof Image>;

export const ItemImageV2 = (
  props: { item: Pick<ItemV2For<'card'>, 'image' | 'description'> } & Partial<ImageProps>
) => {
  const { item } = props;
  const [error, setError] = useState(false);

  const src = error
    ? `/api/cache/items/${item.image.id}.gif`
    : item.image.url || `https://cdn.itemdb.com.br/items/${item.image.id}.gif`;

  return (
    <Image
      src={src}
      width={80}
      height={80}
      unoptimized
      alt=""
      title={item.description}
      onError={() => setError(true)}
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      {...(({ item, ...rest }) => rest)(props)}
    />
  );
};
