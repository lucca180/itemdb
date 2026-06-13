import { getTranslations } from 'next-intl/server';

export type LoginPageLabels = {
  confirmEmail: string;
  emailPlaceholder: string;
  continue: string;
  moreInfo: string;
  neopetsUsernameReason: string;
  itemdbUsername: string;
  usernamePlaceholder: string;
  usernameHelper: string;
  neopetsUsername: string;
  neopetsUsernamePlaceholder: string;
  invalidEmail: string;
  fillAllFields: string;
  onlyLettersNumbers: string;
  usernameTaken: string;
};

export async function buildLoginPageProps(): Promise<LoginPageLabels> {
  const t = await getTranslations();

  return {
    confirmEmail: t('Login.please-confirm-your-email-address'),
    emailPlaceholder: t('General.email-address'),
    continue: t('General.continue'),
    moreInfo: t('Login.moreInfo'),
    neopetsUsernameReason: t('Login.neopetsUsernameReason'),
    itemdbUsername: t('Login.itemdb-username'),
    usernamePlaceholder: t('Login.username'),
    usernameHelper: t('Login.only-letters-numbers-and-underlines'),
    neopetsUsername: t('Login.neopets-username'),
    neopetsUsernamePlaceholder: t('Login.neopets-username'),
    invalidEmail: t('Login.invalid-email-address'),
    fillAllFields: t('Login.please-fill-all-fields'),
    onlyLettersNumbers: t('Login.only-letters-numbers'),
    usernameTaken: t('Login.username-already-taken'),
  };
}
