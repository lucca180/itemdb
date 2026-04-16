/** Shortcodes supported in article content */
export const SUPPORTED_SHORTCODES = ['alert'] as const;

export type ShortcodeName = (typeof SUPPORTED_SHORTCODES)[number];

/**
 * Replaces WordPress-style shortcodes with custom HTML elements (<sc-name>)
 * so they can be processed by html-react-parser's replace option.
 *
 * Supports block:       [name key="val"]content[/name]
 * Supports self-closing: [name key="val" /]
 */
/** Normalize WordPress smart/curly quotes to plain double quotes so HTML attribute parsing works. */
function normalizeAttrs(attrs: string): string {
  return attrs
    .replace(/\u201C|&#8220;|&#x201[Cc];|&ldquo;/g, '"')
    .replace(/\u201D|&#8221;|&#x201[Dd];|&rdquo;/g, '"');
}

export function processShortcodes(html: string): string {
  let result = html;
  for (const name of SUPPORTED_SHORTCODES) {
    // Self-closing: [name attrs /]
    result = result.replace(
      new RegExp(`\\[${name}(\\s[^\\]]*)?\\s*\\/\\]`, 'gi'),
      (_, attrs = '') => `<sc-${name}${normalizeAttrs(attrs)}></sc-${name}>`
    );
    // Block: [name attrs]inner[/name]
    // Also handles WordPress wpautop wrapping shortcode tags in <p> elements.
    result = result.replace(
      new RegExp(
        `(?:<p[^>]*>)?\\s*\\[${name}(\\s[^\\]]*)?\\]\\s*(?:</p>)?(.*?)(?:<p[^>]*>)?\\s*\\[\\/${name}\\]\\s*(?:</p>)?`,
        'gis'
      ),
      (_, attrs = '', inner: string) => `<sc-${name}${normalizeAttrs(attrs)}>${inner}</sc-${name}>`
    );
  }

  return result.replaceAll('\r', '');
}
