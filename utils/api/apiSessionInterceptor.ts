import axios from 'axios';
import { waitForApiSession } from '@utils/api/apiSessionGate';

let installed = false;

export function installApiSessionInterceptor() {
  if (installed) return;
  installed = true;

  axios.interceptors.request.use(async (config) => {
    const url = config.url ?? '';
    if (
      typeof window === 'undefined' ||
      !url.includes('/api/') ||
      url.includes('/api/auth') ||
      url.includes('/api/v1/users/getSession')
    ) {
      return config;
    }

    await waitForApiSession();
    return config;
  });
}
