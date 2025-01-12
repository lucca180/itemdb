import dynamic from 'next/dynamic';
import ListViewport, { ListViewportProps } from './ListViewport';

const SortableArea = dynamic(() => import('../Sortable/SortableArea'));

export const ItemList = (props: ListViewportProps) => {
  return <>{props.activateSort ? <SortableArea {...props} /> : <ListViewport {...props} />}</>;
};
