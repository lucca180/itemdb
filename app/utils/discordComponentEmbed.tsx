/**
 * Discord "Component Embed" link previews.
 * https://discord.com/developers/docs/link-previews/component-embeds
 *
 * Discord's crawler only reads server-rendered HTML, so the payload must be emitted
 * as a literal <script id="discord:component-embed" type="application/json"> tag —
 * there's no Next.js Metadata API hook for it (mirrors the JSON-LD pattern in
 * app/[locale]/articles/articleJsonLd.ts).
 */

export type DiscordEmoji = { name?: string; id?: string; animated?: boolean };

export type DiscordButtonComponent = {
  type: 2;
  style: 5;
  url: string;
  label?: string;
  emoji?: DiscordEmoji;
  disabled?: boolean;
};

export type DiscordActionRowComponent = {
  type: 1;
  components: DiscordButtonComponent[];
};

export type DiscordUnfurledMedia = { url: string };

export type DiscordThumbnailComponent = {
  type: 11;
  media: DiscordUnfurledMedia;
  description?: string;
  spoiler?: boolean;
};

export type DiscordTextDisplayComponent = {
  type: 10;
  content: string;
};

export type DiscordSectionComponent = {
  type: 9;
  components: DiscordTextDisplayComponent[];
  accessory: DiscordThumbnailComponent | DiscordButtonComponent;
};

export type DiscordMediaGalleryItem = {
  media: DiscordUnfurledMedia;
  description?: string;
  spoiler?: boolean;
};

export type DiscordMediaGalleryComponent = {
  type: 12;
  items: DiscordMediaGalleryItem[];
};

export type DiscordSeparatorComponent = {
  type: 14;
  divider?: boolean;
  spacing?: 1 | 2;
};

export type DiscordEmbedComponent =
  | DiscordActionRowComponent
  | DiscordSectionComponent
  | DiscordTextDisplayComponent
  | DiscordThumbnailComponent
  | DiscordMediaGalleryComponent
  | DiscordSeparatorComponent;

export type DiscordContainerComponent = {
  type: 17;
  accent_color?: number;
  spoiler?: boolean;
  components: DiscordEmbedComponent[];
};

export type DiscordComponentEmbedPayload = {
  component: DiscordContainerComponent;
};

/** "#a1b2c3" -> 10597059, Discord's expected decimal color format. */
export function hexToDiscordColor(hex: string): number | undefined {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return undefined;
  return parseInt(normalized, 16);
}

export function stringifyDiscordEmbed(payload: DiscordComponentEmbedPayload): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export function DiscordComponentEmbedScript({
  payload,
}: {
  payload: DiscordComponentEmbedPayload;
}) {
  return (
    <script
      id="discord:component-embed"
      type="application/json"
      dangerouslySetInnerHTML={{ __html: stringifyDiscordEmbed(payload) }}
    />
  );
}
