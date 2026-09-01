import { v4 as uuidv4 } from 'uuid';

export abstract class Entity<T> {
  public readonly id: string;
  protected props: T;

  constructor(props: T, id?: string) {
    this.id = id ?? uuidv4();
    this.props = props;
  }

  public equals(other?: Entity<T>): boolean {
    if (other === null || other === undefined) return false;
    if (this === other) return true;
    return this.id === other.id;
  }
}
