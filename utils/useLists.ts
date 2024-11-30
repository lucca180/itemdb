import axios, { AxiosRequestConfig } from 'axios';
import useSWR from 'swr';
import { useAuth } from './auth';
import { UserList } from '../types';

function fetcher<T>(url: string, config?: AxiosRequestConfig<any>): Promise<T> {
  return axios.get(url, config).then((res) => res.data);
}

export const useLists = () => {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useSWR(
    !user ? null : `/api/v1/lists/${user.username}`,
    fetcher
  );

  const addItemToList = async (listId: number, item_iids: number | number[]) => {
    if (!user) return;

    const itemArray = Array.isArray(item_iids) ? item_iids : [item_iids];
    const items = itemArray.map((id) => ({ item_iid: id }));

    await axios.put(`/api/v1/lists/${user.username}/${listId}`, {
      items: items,
    });

    mutate();
  };

  return {
    lists: (data ?? []) as UserList[],
    error,
    isLoading,
    addItemToList,
    revalidate: mutate,
  };
};
