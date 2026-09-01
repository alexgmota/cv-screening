import { describe, it, expect } from 'vitest';
import { Message, MessageRole } from './message.entity';

describe('Message', () => {
  it('creates a message with content, role, and timestamp', () => {
    const msg = Message.create('Hello', MessageRole.USER);

    expect(msg.content).toBe('Hello');
    expect(msg.role).toBe(MessageRole.USER);
    expect(msg.timestamp).toBeInstanceOf(Date);
  });

  it('creates assistant message', () => {
    const msg = Message.create('I can help with that.', MessageRole.ASSISTANT);

    expect(msg.content).toBe('I can help with that.');
    expect(msg.role).toBe(MessageRole.ASSISTANT);
  });

  it('creates system message', () => {
    const msg = Message.create('System prompt', MessageRole.SYSTEM);

    expect(msg.role).toBe(MessageRole.SYSTEM);
  });

  it('timestamps are close to now', () => {
    const before = Date.now();
    const msg = Message.create('test', MessageRole.USER);
    const after = Date.now();

    expect(msg.timestamp.getTime()).toBeGreaterThanOrEqual(before);
    expect(msg.timestamp.getTime()).toBeLessThanOrEqual(after);
  });
});
