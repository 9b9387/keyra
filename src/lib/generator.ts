import { scrypt } from 'scrypt-js';
import { KeyraRule } from './keyra-rule';
import { KeyraData } from './keyra-data';

export class Generator {
  /**
   * Generate a hash for password creation
   * 
   * @param masterPassword The master password used as the base for generating all service passwords
   * @param serviceName The service name, ensuring unique passwords for each service
   * @param version The password version, allowing password updates for specific services without changing the master password
   * @returns A 64-byte hash buffer that serves as the basis for password generation
   */
  private async generateHash(masterPassword: string, serviceName: string, version: number): Promise<Uint8Array> {
    const passwordBuffer = new TextEncoder().encode(masterPassword);
    const salt = new TextEncoder().encode(`${serviceName}:${version}`);
    
    return await scrypt(passwordBuffer, salt, 16384, 8, 1, 64);
  }

  /**
   * Generate the actual password string based on the hash and rules
   * 
   * @param hash The hash buffer generated from the master password and service information
   * @param rule Password generation rules including length and character requirements
   * @returns The password string generated according to the rules
   */
  private generatePasswordFromHash(hash: Uint8Array, rule: KeyraRule): string {
    // 验证输入参数
    if (!hash || !(hash instanceof Uint8Array)) {
      throw new Error('Hash must be a valid Uint8Array');
    }
    
    if (!rule || !(rule instanceof KeyraRule)) {
      throw new Error('Rule must be a valid KeyraRule instance');
    }

    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = Array.from(new Set(rule.allowedSymbols)).sort().join('');
    
    let availableChars = '';
    if (rule.requireUppercase) availableChars += uppercaseChars;
    if (rule.requireLowercase) availableChars += lowercaseChars;
    if (rule.requireNumbers) availableChars += numberChars;
    if (rule.requireSymbols) availableChars += symbolChars;
    
    if (availableChars.length === 0) {
      throw new Error('No available characters for password generation. Please enable at least one character type.');
    }
    
    const availableCharsArray = Array.from(availableChars);
    for (let i = availableCharsArray.length - 1; i > 0; i--) {
      const j = hash[(i * 7) % hash.length] % (i + 1);
      [availableCharsArray[i], availableCharsArray[j]] = [availableCharsArray[j], availableCharsArray[i]];
    }
    availableChars = availableCharsArray.join('');
    
    let passwordChars: string[] = [];
    
    // Ensure required character types are included
    if (rule.requireUppercase) {
      passwordChars.push(uppercaseChars[hash[0] % uppercaseChars.length]);
    }
    
    if (rule.requireLowercase) {
      passwordChars.push(lowercaseChars[hash[1] % lowercaseChars.length]);
    }
    
    if (rule.requireNumbers) {
      passwordChars.push(numberChars[hash[2] % numberChars.length]);
    }
    
    if (rule.requireSymbols && symbolChars.length > 0) {
      passwordChars.push(symbolChars[hash[3] % symbolChars.length]);
    }
    
    if (rule.length < passwordChars.length) {
      throw new Error(`Password length (${rule.length}) must be at least ${passwordChars.length} to accommodate required character types`);
    }
    
    // Fill to the required length using the remaining hash portions
    const remainingLength = rule.length - passwordChars.length;
    for (let i = 4; i < 4 + remainingLength && i < hash.length; i++) {
      passwordChars.push(availableChars[hash[i] % availableChars.length]);
    }
    
    // Shuffle the password characters deterministically
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = hash[i % hash.length] % (i + 1); // Use hash value to generate index, ensuring determinism
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }
    
    return passwordChars.join('');
  }

  /**
   * Password generation function that converts a master password 
   * and service data into a deterministic password
   * 
   * @param masterPassword The user's master password
   * @param data Data object containing service name, version, and password rules
   * @returns The generated password string
   * @throws Error if validation fails
   */
  public async generate(masterPassword: string, data: KeyraData): Promise<string> {
    if (!masterPassword || typeof masterPassword !== 'string') {
      throw new Error('Master password must be a non-empty string');
    }

    if (!data.serviceName || typeof data.serviceName !== 'string') {
      throw new Error('Service name must be a non-empty string');
    }

    if (data.rule.validate() === false) {
      throw new Error('Invalid password rule');
    }
    
    const hash = await this.generateHash(masterPassword, data.serviceName, data.version);
    return this.generatePasswordFromHash(hash, data.rule);
  }
}