import { Button, Icon, useDisclosure } from '@chakra-ui/react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { FiSend } from 'react-icons/fi';

const FeedbackModal = dynamic(() => import('../../components/Modal/FeedbackModal'));

type FeedbackButtonProps = React.ComponentProps<typeof Button>;

const FeedbackButton = (props: FeedbackButtonProps) => {
  const t = useTranslations();
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <>
      {isOpen && <FeedbackModal isOpen={isOpen} onClose={onClose} />}
      <Button
        variant="outline"
        size="sm"
        onClick={onOpen}
        data-umami-event="feedback-button"
        {...props}
      >
        {!props.children && (
          <>
            <Icon as={FiSend} mr={1} /> {t('Button.feedback')}
          </>
        )}
        {props.children}
      </Button>
    </>
  );
};

export default FeedbackButton;
