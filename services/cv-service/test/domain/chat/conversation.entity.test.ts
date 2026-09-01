import { describe, it, expect } from 'vitest';
import { Message, MessageRole } from '../../../src/domain/chat/message.entity';
import { Conversation } from '../../../src/domain/chat/conversation.entity';

describe('Conversation', () => {
  it('creates an empty conversation with a uuid', () => {
    const conv = Conversation.create();

    expect(conv.id).toBeDefined();
    expect(typeof conv.id).toBe('string');
    expect(conv.messages).toEqual([]);
    expect(conv.context).toBeUndefined();
  });

  it('creates a conversation with context', () => {
    const context = { cvId: 'cv-123' };
    const conv = Conversation.create(context);

    expect(conv.context).toEqual(context);
  });

  it('adds messages and updates updatedAt', () => {
    const conv = Conversation.create();
    const msg1 = Message.create('Hi', MessageRole.USER);
    const msg2 = Message.create('Hello', MessageRole.ASSISTANT);

    conv.addMessage(msg1);
    conv.addMessage(msg2);

    expect(conv.messages).toHaveLength(2);
    expect(conv.messages[0].content).toBe('Hi');
    expect(conv.messages[1].content).toBe('Hello');
  });

  it('lastMessage returns the most recent message', () => {
    const conv = Conversation.create();
    expect(conv.lastMessage).toBeUndefined();

    const msg = Message.create('Test', MessageRole.USER);
    conv.addMessage(msg);
    expect(conv.lastMessage?.content).toBe('Test');
  });

  it('messages getter returns a defensive copy', () => {
    const conv = Conversation.create();
    conv.addMessage(Message.create('A', MessageRole.USER));

    const msgs = conv.messages;
    msgs.push(Message.create('B', MessageRole.ASSISTANT));

    expect(conv.messages).toHaveLength(1);
  });

  it('constructor accepts an explicit id', () => {
    const conv = new Conversation(
      { messages: [], createdAt: new Date(), updatedAt: new Date() },
      'custom-id'
    );

    expect(conv.id).toBe('custom-id');
  });
});
