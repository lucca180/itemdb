// `stylis` ships without types; it's installed as a dependency of `@emotion/cache`.
declare module 'stylis' {
  import type { StylisPlugin } from '@emotion/cache';

  export const prefixer: StylisPlugin;
}
