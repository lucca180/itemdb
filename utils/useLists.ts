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
    fetcher,
  );

  return {
    lists: (data ?? []) as UserList[],
    error,
    isLoading,
    revalidate: mutate,
  };
};
