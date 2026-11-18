'use client';

import { useTranslations } from 'next-intl';
import { ComponentType } from 'react';
import { RestockReviewData } from './mockData';
import {
  CommunitySlide,
  FastestSlide,
  FavoriteSlide,
  HeatmapSlide,
  HoursSlide,
  IntroSlide,
  LossSlide,
  ShopSlide,
  SlideProps,
  TopBoughtSlide,
  TypeSlide,
} from './ReviewSlides';
import { ShareSlide } from './ReviewShare';
import { SlideTheme } from './reviewTheme';
import { StoriesPlayer } from './StoriesPlayer';

export const RESTOCK_SLIDES: { theme: SlideTheme; Slide: ComponentType<SlideProps> }[] = [
  { theme: 'lime', Slide: IntroSlide },
  { theme: 'dark', Slide: HoursSlide },
  { theme: 'dark', Slide: ShopSlide },
  { theme: 'dark', Slide: FavoriteSlide },
  { theme: 'dark', Slide: TopBoughtSlide },
  { theme: 'cream', Slide: FastestSlide },
  { theme: 'loss', Slide: LossSlide },
  { theme: 'dark', Slide: HeatmapSlide },
  { theme: 'dark', Slide: CommunitySlide },
  { theme: 'lime', Slide: TypeSlide },
  { theme: 'dark', Slide: ShareSlide },
];

type ReviewStoriesProps = {
  data: RestockReviewData;
  onExit?: () => void;
};

export const ReviewStories = ({ data, onExit }: ReviewStoriesProps) => {
  const t = useTranslations('RestockReview');

  return (
    <StoriesPlayer
      brand={t('brand', { year: data.year })}
      handle={`@${data.username}`}
      onExit={onExit}
      stories={RESTOCK_SLIDES.map(({ theme, Slide }) => ({
        theme,
        render: (colors) => <Slide data={data} theme={colors} />,
      }))}
    />
  );
};
