import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@utils/auth/getCurrentUser';
import { isValidLocale } from '@utils/locales';
import prisma from '@utils/prisma';
import { LayoutLocaleSelectClient } from './LayoutLocaleSelectClient';
import { getLocalizedPath } from '@components/Layout/layoutData';

type LayoutLocaleIslandProps = {
  locale: string;
  currentPath: string;
};

function isLocale(value: FormDataEntryValue | null): value is LayoutLocaleIslandProps['locale'] {
  return typeof value === 'string' && isValidLocale(value);
}

export function LayoutLocaleIsland({ locale, currentPath }: LayoutLocaleIslandProps) {
  async function changeLocaleAction(formData: FormData) {
    'use server';

    const prefLang = formData.get('prefLang');

    if (!isLocale(prefLang)) {
      return;
    }

    const cookieStore = await cookies();
    cookieStore.set('NEXT_LOCALE', prefLang, {
      expires: new Date('2030-01-01'),
      sameSite: 'none',
      secure: true,
      path: '/',
    });

    const targetPath = getLocalizedPath(currentPath, prefLang);
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      redirect(targetPath);
    }

    try {
      const { user } = await getCurrentUser({ sessionCookie });

      if (!user) {
        redirect(targetPath);
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { pref_lang: prefLang },
      });
    } catch {
      // Persisting the cookie is enough to switch the locale for guests or on DB failures.
    }

    redirect(targetPath);
  }

  return <LayoutLocaleSelectClient action={changeLocaleAction} locale={locale} />;
}
