import { getTranslations } from 'next-intl/server';

export type PriceCalculatorCalcMode =
  | 'pure'
  | 'babyPB'
  | 'startPrice'
  | 'minIncrement'
  | 'babyPBNoLimit';

export type PriceCalculatorPageLabels = {
  heading: string;
  description: string;
  askingPriceLabel: string;
  askingPricePlaceholder: string;
  priceHelperText: string;
  premiumMemberLabel: string;
  calcModeOptions: Record<PriceCalculatorCalcMode, string>;
  youShouldAskFor: string;
  tpWarning: string;
  babyPaintBrushLabel: string;
  yourAuctionShouldBe: string;
  auctionWarning: string;
  startingPriceLabel: string;
  minIncrementLabel: string;
  auctionHelperText: string;
};

export async function buildPriceCalculatorPageProps(): Promise<PriceCalculatorPageLabels> {
  const t = await getTranslations();

  return {
    heading: t('Calculator.pricing-calculator'),
    description: t('Calculator.description'),
    askingPriceLabel: t('Calculator.your-asking-price-in-nps'),
    askingPricePlaceholder: t('Calculator.enter-the-price-in-neopoints'),
    priceHelperText: t('Calculator.price-helper-text'),
    premiumMemberLabel: 'Premium Member?',
    calcModeOptions: {
      pure: t('Calculator.tp-max-pure-value'),
      babyPB: t('Calculator.tp-max-baby-paint-brush-amount'),
      babyPBNoLimit: t('Calculator.tp-max-baby-paint-brush-amount-no-10-item-limit'),
      startPrice: t('Calculator.auction-max-start-price'),
      minIncrement: t('Calculator.auction-max-minimum-increment'),
    },
    youShouldAskFor: t('Calculator.you-should-ask-for'),
    tpWarning: t('Calculator.tp-warning'),
    babyPaintBrushLabel: 'Baby Paint Brush',
    yourAuctionShouldBe: t('Calculator.your-auction-should-be'),
    auctionWarning: t('Calculator.auction-warning'),
    startingPriceLabel: 'Starting Price:',
    minIncrementLabel: 'Min Increment:',
    auctionHelperText: t('Calculator.auction-helper-text', { x: '__VALUE__' }),
  };
}
