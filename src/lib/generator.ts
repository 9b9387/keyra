import { scrypt } from 'scrypt-js';
import { KeyraRule } from './keyra-rule';
import { KeyraData } from './keyra-data';

export class Generator {
  /**
   * Generates a hash of a specified length. If the required length is greater than 64 bytes,
   * it extends the hash using a counter-like mode with scrypt.
   *
   * @param masterPassword The master password.
   * @param serviceName The service name.
   * @param version The password version.
   * @param requiredLength The required length of the hash in bytes.
   * @returns A Uint8Array with the specified length.
   */
  private async generateSufficientHash(
    masterPassword: string,
    serviceName: string,
    version: number,
    requiredLength: number
  ): Promise<Uint8Array> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(masterPassword);
    const salt = encoder.encode(`keyra|${serviceName}|${version}`);
    const N = 16384, r = 8, p = 1;

    return await scrypt(passwordBuffer, salt, N, r, p, requiredLength);
  }

  /**
   * Generate the actual password string based on the hash and rules
   * 
   * @param hash The hash buffer generated from the master password and service information
   * @param rule Password generation rules including length and character requirements
   * @returns The password string generated according to the rules
   */
  private async generatePasswordFromHash(hash: Uint8Array, rule: KeyraRule): Promise<string> {
    if (!hash || !(hash instanceof Uint8Array) || hash.length < rule.length) {
      throw new Error('Hash must be a valid Uint8Array with length at least equal to the password length.');
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

    const passwordChars: string[] = [];
    let hashIndex = 0;
    const consumeHashByte = () => hash[hashIndex++ % hash.length];

    if (rule.requireUppercase) {
      passwordChars.push(this.selectCharFromSet(consumeHashByte, uppercaseChars));
    }
    if (rule.requireLowercase) {
      passwordChars.push(this.selectCharFromSet(consumeHashByte, lowercaseChars));
    }
    if (rule.requireNumbers) {
      passwordChars.push(this.selectCharFromSet(consumeHashByte, numberChars));
    }
    if (rule.requireSymbols && symbolChars.length > 0) {
      passwordChars.push(this.selectCharFromSet(consumeHashByte, symbolChars));
    }

    if (rule.length < passwordChars.length) {
      throw new Error(`Password length (${rule.length}) must be at least ${passwordChars.length} to accommodate required character types`);
    }

    const remainingLength = rule.length - passwordChars.length;
    for (let i = 0; i < remainingLength; i++) {
      passwordChars.push(this.selectCharFromSet(consumeHashByte, availableChars));
    }

    this.shuffleArray(passwordChars, hash, hashIndex);
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
    
    // We need at least one byte per character for the password.
    const requiredHashLength = data.rule.length;
    const version = data.version || 1;
    const serviceName = data.serviceName;
    const hash = await this.generateSufficientHash(masterPassword, serviceName, version, requiredHashLength);
    return await this.generatePasswordFromHash(hash, data.rule);
  }

  private selectCharFromSet(nextByte: () => number, charset: string): string {
    const len = charset.length;
    if (len <= 0) throw new Error('Empty charset');
    const maxValid = Math.floor(256 / len) * len;
    while (true) {
      const b = nextByte();
      if (b < maxValid) {
        return charset[b % len];
      }
    }
  }
  /**
   * Shuffle an array in place using a hash to ensure randomness
   * 
   * @param array The array to shuffle
   * @param hash The hash used for shuffling randomness
   * @param startIndex The starting index in the hash to use for shuffling
   * @returns The new index in the hash after shuffling
   */
  private shuffleArray<T>(array: T[], hash: Uint8Array, startIndex: number): number {
    let hashIndex = startIndex;
    
    for (let i = array.length - 1; i > 0; i--) {
      const byte1 = hash[hashIndex++ % hash.length];
      const byte2 = hash[hashIndex++ % hash.length];
      const combined = (byte1 << 8) | byte2;
      const j = combined % (i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    
    return hashIndex;
  }
}