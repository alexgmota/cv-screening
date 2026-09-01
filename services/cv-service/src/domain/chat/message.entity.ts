import { ValueObject } from '../shared/value-object';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

interface MessageProps {
  content: string;
  role: MessageRole;
  timestamp: Date;
}

export class Message extends ValueObject<MessageProps> {
  get content(): string {
    return this.props.content;
  }

  get role(): MessageRole {
    return this.props.role;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  static create(content: string, role: MessageRole): Message {
    return new Message({ content, role, timestamp: new Date() });
  }
}
