import { DEFAULT_RULE, KeyraRule } from './keyra-rule';

export class KeyraData {
  serviceName: string;
  version: number;
  rule: KeyraRule;
  note: string;
  createDate: Date;
  domain: string;

  constructor(
    serviceName: string,
    version: number = 1,
    rule: KeyraRule = DEFAULT_RULE,
    note: string = '',
    createDate: Date = new Date(),
    domain: string = ''
  ) {
    this.serviceName = serviceName;
    this.version = version;
    this.rule = rule;
    this.note = note;
    this.createDate = createDate;
    this.domain = domain;
  }

  /**
   * Serialize the object to a JSON string
   * @returns JSON string
   */
  serialize(): string {
    return JSON.stringify(this);
  }

  /**
   * Deserialize from JSON string to KeyraData object
   * @param json JSON string
   * @returns KeyraData object
   */
  static deserialize(json: string): KeyraData {
    const data = JSON.parse(json);
    return Object.assign(new KeyraData(''), data);
  }

  /**
   * Returns a string representation of the KeyraData in a tree-like format
   * @returns string representation
   */
  toString(): string {
    return `Service: ${this.serviceName}
    ├─ Version     : ${this.version}
    ├─ Create Date : ${this.createDate.toLocaleString()}
    ├─ Note        : ${this.note || 'None'}
    ├─ Domain      : ${this.domain || 'None'}
    └─ Rule        : ${this.rule.name}`;
  }
}