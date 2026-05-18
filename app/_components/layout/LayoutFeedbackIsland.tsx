'use client';

import FeedbackButton from '@components/Feedback/FeedbackButton';

type LayoutFeedbackIslandProps = React.ComponentProps<typeof FeedbackButton>;

export function LayoutFeedbackIsland(props: LayoutFeedbackIslandProps) {
  return <FeedbackButton {...props} />;
}
