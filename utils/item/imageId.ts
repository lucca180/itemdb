// The lookbehind anchors each attempt to a path/extension segment start, keeping the
// scan linear on long inputs (a bare `[^./]+(?=\.gif)` is quadratic → ReDoS).
const IMAGE_ID_REGEX = /(?<![^./])[^./]+(?=\.gif)/;

/** Extracts the Neopets image id from an image URL (`foo` in `.../items/foo.gif`). */
export function getImageId(url: string): string | undefined {
  return url.match(IMAGE_ID_REGEX)?.[0];
}
