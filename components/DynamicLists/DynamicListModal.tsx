import { useAuth } from '@utils/auth';
import { useTranslations } from 'next-intl';
import { ExtendedSearchQuery } from '@types';
import CreateDynamicListDialog from '@components/DynamicLists/CreateDynamicListDialog';

export type DynamicListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resultCount?: number;
  searchQuery?: ExtendedSearchQuery;
};

const DynamicListModal = (props: DynamicListModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, resultCount, searchQuery } = props;
  const { openLogin } = useAuth();

  if (!searchQuery) return null;

  return (
    <CreateDynamicListDialog
      isOpen={isOpen}
      onClose={onClose}
      source="search"
      sourceTitle={searchQuery.s || t('DynamicList.current-search')}
      sourceByline={t('DynamicList.your-search')}
      itemCount={resultCount}
      defaultMode="addOnly"
      defaultName={searchQuery.s ?? ''}
      newListData={{ description: '', cover_url: '', colorHex: '#fff' }}
      dynamicData={{ queryData: searchQuery }}
      onLoginRequired={() => openLogin('search', { trigger: 'search-dynamic-list' })}
      trackProps={{ from: 'search' }}
    />
  );
};

export default DynamicListModal;
