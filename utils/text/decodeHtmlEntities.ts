// @ts-ignore
import he from 'he';

export function decodeHtmlEntities(text: string): string {
  return he.decode(text);
}
