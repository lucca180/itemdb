import { SetMainColor } from '@components/Layout/SetMainColor';
import { NotFoundContent } from '@components/Error/NotFoundContent';

/** UI for `notFound()` inside matched `[locale]` routes; unmatched URLs use `app/global-not-found.tsx`. */
export default function NotFound() {
  return (
    <>
      <SetMainColor color="#ff6464c7" />
      <NotFoundContent />
    </>
  );
}
