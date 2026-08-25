import { Flex, Grid } from '@chakra-ui/react';
import { CapsulesSection } from './sections/CapsulesSection';
import { EventsSection } from './sections/EventsSection';
import { FaqSection } from './sections/FaqSection';
import { KeepReadingSection } from './sections/KeepReadingSection';
import { LeavingSection } from './sections/LeavingSection';
import { MonthlyHighlightsSection } from './sections/MonthlyHighlightsSection';
import { OnSaleSection } from './sections/OnSaleSection';
import { PetStylesSection } from './sections/PetStylesSection';
import { PopularNcSection } from './sections/PopularNcSection';

export function MallHubSectionSlots() {
  return (
    <Flex direction="column" gap={{ base: 6, md: 8 }} w="100%" minW={0}>
      <OnSaleSection />
      <LeavingSection />
      <EventsSection />
      <MonthlyHighlightsSection />
      <PetStylesSection />
      <Grid
        templateColumns={{ base: '1fr', lg: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}
        gap={{ base: 6, lg: 8 }}
        alignItems="stretch"
        w="100%"
        minW={0}
      >
        <PopularNcSection />
        <CapsulesSection />
      </Grid>

      {/* Concept: Keep reading sits after a large vertical gap, no hairline separator. */}
      <Flex direction="column" gap={{ base: 10, md: 14 }} pt={{ base: 4, md: 8 }} w="100%" minW={0}>
        <KeepReadingSection />
        <FaqSection />
      </Flex>
    </Flex>
  );
}
