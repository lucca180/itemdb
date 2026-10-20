import * as Sentry from '@sentry/nextjs';

type BackgroundErrorOptions = {
  /** short task name, used as tag and attachment filename (e.g. `feedback.commit`) */
  task: string;
  tags?: Record<string, string | number | boolean | null | undefined>;
  /** full payload needed to redo the work by hand - sent as a JSON attachment */
  data: Record<string, unknown>;
};

/**
 * Reports a failure from work that runs after the response (`after()`), where the user already
 * got a success and nothing else would surface it. Attach everything needed to redo it - but no
 * ip/e-mail: server events don't carry PII.
 */
export const reportBackgroundError = (error: unknown, options: BackgroundErrorOptions) => {
  const { task, tags = {}, data } = options;

  // warn, not error: console.error is already forwarded to Sentry (captureConsoleIntegration)
  console.warn(`[${task}] background task failed`, error);

  Sentry.withScope((scope) => {
    scope.setTag('background_task', task);
    for (const [key, value] of Object.entries(tags)) {
      if (value !== undefined && value !== null) scope.setTag(key, String(value));
    }

    scope.addAttachment({
      filename: `${task}.json`,
      contentType: 'application/json',
      data: safeStringify(data),
    });

    Sentry.captureException(error);
  });
};

const safeStringify = (data: unknown) => {
  try {
    return JSON.stringify(
      data,
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2
    );
  } catch (e) {
    return JSON.stringify({ unserializable: String(e) });
  }
};
