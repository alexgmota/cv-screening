/**
 * Base class for value objects.
 * Value objects are immutable and defined by their attributes, not identity.
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
  }

  /** Get the value object's value */
  get value(): Readonly<T> {
    return this._value;
  }

  /**
   * Check equality by value.
   * Two value objects are equal if they have the same attributes.
   */
  equals(object?: ValueObject<T>): boolean {
    if (object === null || object === undefined) {
      return false;
    }

    if (this === object) {
      return true;
    }

    if (!(object instanceof ValueObject)) {
      return false;
    }

    return JSON.stringify(this._value) === JSON.stringify(object._value);
  }
}
