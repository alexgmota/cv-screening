/** Unique identifier type */
export type UniqueId = string;

/**
 * Base class for domain entities.
 * Entities are defined by their identity, not their attributes.
 */
export abstract class Entity<T> {
  protected readonly _id: UniqueId;
  protected readonly _props: T;

  constructor(id: UniqueId, props: T) {
    this._id = id;
    this._props = props;
  }

  /** Get the entity's unique identifier */
  get id(): UniqueId {
    return this._id;
  }

  /** Get the entity's properties */
  get props(): Readonly<T> {
    return this._props;
  }

  /**
   * Check equality by identity.
   * Two entities are equal if they have the same id.
   */
  equals(object?: Entity<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof Entity)) {
      return false;
    }

    return this._id === object._id;
  }
}
