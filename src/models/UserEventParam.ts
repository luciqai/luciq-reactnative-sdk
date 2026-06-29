/**
 * A key-value parameter that can be attached to a user event.
 */
export class UserEventParam {
  key: string;
  value: string;

  constructor(key: string, value: string) {
    this.key = key;
    this.value = value;
  }
}
