import { beforeEach, describe, expect, test, vi } from 'vitest';

const scope = vi.hoisted(() => ({ setTag: vi.fn(), addAttachment: vi.fn() }));
const sentry = vi.hoisted(() => ({
  withScope: vi.fn((fn: (s: typeof scope) => void) => fn(scope)),
  captureException: vi.fn(),
}));

vi.mock('@sentry/nextjs', () => sentry);

import { reportBackgroundError } from '@utils/api/reportBackgroundError';

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

describe('reportBackgroundError', () => {
  test('captures the error with task tags and the payload as a JSON attachment', () => {
    const error = new Error('boom');

    reportBackgroundError(error, {
      task: 'feedback.commit',
      tags: { feedback_id: 1, voter: 'abc', skipped: undefined },
      data: { feedback_id: 1, votes: [{ user_id: 'abc', approve: true }], big: BigInt(5) },
    });

    expect(sentry.captureException).toHaveBeenCalledWith(error);
    expect(scope.setTag).toHaveBeenCalledWith('background_task', 'feedback.commit');
    expect(scope.setTag).toHaveBeenCalledWith('feedback_id', '1');
    expect(scope.setTag).toHaveBeenCalledWith('voter', 'abc');
    expect(scope.setTag).not.toHaveBeenCalledWith('skipped', expect.anything());

    const attachment = scope.addAttachment.mock.calls[0][0];
    expect(attachment).toMatchObject({
      filename: 'feedback.commit.json',
      contentType: 'application/json',
    });
    expect(JSON.parse(attachment.data)).toEqual({
      feedback_id: 1,
      votes: [{ user_id: 'abc', approve: true }],
      big: '5',
    });
  });

  test('logs with console.warn so captureConsole does not report it twice', () => {
    const consoleError = vi.spyOn(console, 'error');

    reportBackgroundError(new Error('boom'), { task: 'x', data: {} });

    expect(console.warn).toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  });
});
