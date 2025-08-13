// Password rule class definition
export class KeyraRule {
  name: string;
  length: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  allowedSymbols: string;

  constructor(
    name: string = '',
    length: number = DEFAULT_RULE.length,
    requireUppercase: boolean = DEFAULT_RULE.requireUppercase,
    requireLowercase: boolean = DEFAULT_RULE.requireLowercase,
    requireNumbers: boolean = DEFAULT_RULE.requireNumbers,
    requireSymbols: boolean = DEFAULT_RULE.requireSymbols,
    allowedSymbols: string = DEFAULT_RULE.allowedSymbols
  ) {
    this.name = name;
    this.length = length;
    this.requireUppercase = requireUppercase;
    this.requireLowercase = requireLowercase;
    this.requireNumbers = requireNumbers;
    this.requireSymbols = requireSymbols;
    this.allowedSymbols = allowedSymbols;
  }

  // Validate if the rule is legal
  public validate(): boolean {
    if (this.length < 4) {
      console.error('Minimum length cannot be less than 4');
      return false
    }

    if (this.length > 4096) {
      console.error('Maximum length cannot exceed 4096');
      return false;
    }
    // Ensure allowedSymbols only contains ASCII characters
    if (!/^[\x20-\x7E]*$/.test(this.allowedSymbols)) {
      console.error('Allowed symbols must only contain ASCII characters');
      return false;
    }
    return true;
  }

  // Serialize the rule to JSON format
  public serialize(): string {
    // Directly serialize the entire object without manually listing each field
    return JSON.stringify(this);
  }

  // Deserialize from JSON string to KeyraRule object
  public static deserialize(jsonStr: string): KeyraRule {
    try {
      const data = JSON.parse(jsonStr);
      return new KeyraRule(
        data.name,
        data.length,
        data.requireUppercase,
        data.requireLowercase,
        data.requireNumbers,
        data.requireSymbols,
        data.allowedSymbols
      );
    } catch (error) {
      console.error(`Failed to parse KeyraRule from JSON: ${error}`);
    }
    return DEFAULT_RULE;
  }

  // Returns a string representation of the rule in a tree-like format
  toString(): string {
    return `Rule: ${this.name}
    ├─ Length    : ${this.length}
    ├─ Require uppercase : ${this.requireUppercase ? 'Yes' : 'No'}
    ├─ Require lowercase : ${this.requireLowercase ? 'Yes' : 'No'}
    ├─ Require numbers   : ${this.requireNumbers ? 'Yes' : 'No'}
    ├─ Require symbols   : ${this.requireSymbols ? 'Yes' : 'No'}
    └─ Allowed symbols   : ${this.requireSymbols ? this.allowedSymbols : 'None'}`;
  }
}

// Default rule
export const DEFAULT_RULE: KeyraRule = new KeyraRule(
  'default',
  16,
  true,
  true,
  true,
  true,
  '!@#$%^&*()_+-=[]{}|;:,.<>?'
);

