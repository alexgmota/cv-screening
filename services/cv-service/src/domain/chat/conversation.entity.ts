import { v4 as uuidv4 } from 'uuid';
import { Message } from './message.entity';

interface ConversationProps {
  messages: Message[];
  context?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Conversation {
  public readonly id: string;
  private props: ConversationProps;

  constructor(props: ConversationProps, id?: string) {
    this.id = id ?? uuidv4();
    this.props = props;
  }

  get messages(): Message[] {
    return [...this.props.messages];
  }

  get context(): Record<string, unknown> | undefined {
    return this.props.context;
  }

  get lastMessage(): Message | undefined {
    return this.props.messages[this.props.messages.length - 1];
  }

  addMessage(message: Message): void {
    this.props.messages.push(message);
    this.props.updatedAt = new Date();
  }

  static create(context?: Record<string, unknown>): Conversation {
    return new Conversation({
      messages: [],
      context,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
