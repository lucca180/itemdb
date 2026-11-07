import { UserList } from '@types';
import { useAuth } from '@utils/auth';
import { useTranslations } from 'next-intl';
import CreateDynamicListDialog from '@components/DynamicLists/CreateDynamicListDialog';

export type LinkedListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  list: UserList;
  onCreate?: (newList: UserList) => void;
  /** Where the modal was opened from, sent with the confirm event (e.g. `goal-counter-info`) */
  trackSource?: string;
  /** The list can back a Goal Counter */
  showGoalStep?: boolean;
};

const LinkedListModal = (props: LinkedListModalProps) => {
  const t = useTranslations();
  const { isOpen, onClose, list, onCreate, trackSource, showGoalStep } = props;
  const { openLogin } = useAuth();

  return (
    <CreateDynamicListDialog
      isOpen={isOpen}
      onClose={onClose}
      source="list"
      sourceTitle={list.name}
      sourceByline={list.official ? t('General.official') : (list.owner.username ?? '')}
      sourceImage={list.coverURL}
      itemCount={list.itemCount ?? undefined}
      defaultMode="fullSync"
      defaultName={`${list.name} (Checklist)`}
      newListData={{
        description: list.description,
        coverURL: list.coverURL,
        colorHex: list.colorHex,
      }}
      dynamicData={{ linked_id: list.internal_id }}
      onLoginRequired={() => openLogin('checklist', { trigger: 'checklist-modal' })}
      trackProps={{ from: 'linked', ...(trackSource && { source: trackSource }) }}
      onCreate={
        onCreate &&
        ((newList, mode) =>
          onCreate({ ...newList, dynamicType: mode, linkedListId: list.internal_id }))
      }
      showGoalStep={showGoalStep}
    />
  );
};

export default LinkedListModal;
