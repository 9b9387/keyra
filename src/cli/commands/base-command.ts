import { Command } from 'commander';
import { Generator } from '../../lib';
import * as readline from 'readline';
import { RuleManager } from '../managers/rule-manager';

/**
 * Base Command - All commands should inherit from this class
 */
export abstract class BaseCommand {
  protected name: string;
  protected description: string;
  protected ruleManager: RuleManager;
  protected passwordGenerator: Generator;

  /**
   * Constructor
   * @param name Command name
   * @param description Command description
   */
  constructor(name: string, description: string) {
    this.name = name;
    this.description = description;
    this.ruleManager = new RuleManager();
    this.passwordGenerator = new Generator();
  }

  /**
   * Configure command
   * @param program Commander program instance
   */
  public abstract configure(program: Command): void;

  /**
   * Get command name
   */
  public getName(): string {
    return this.name;
  }

  /**
   * Get command description
   */
  public getDescription(): string {
    return this.description;
  }

  /**
   * Wrap readline's question method as a Promise
   */
  protected async askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(question, (answer) => {
        resolve(answer);
        rl.close();
      });
    });
  }

  /**
   * Get master password from user input
   */
  protected async getMasterPasswordFromUser(): Promise<string> {
    return new Promise((resolve) => {
      // Set raw mode to disable automatic echo
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdout.write('Enter master password: ');

      let password = '';

      process.stdin.on('data', (data: Buffer) => {
        const char = data.toString();

        // Handle enter key, indicating input complete
        if (char === '\r' || char === '\n' || char === '\u0004') {
          process.stdout.write('\n');
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdin.removeAllListeners('data');
          resolve(password);
          return;
        }

        // Handle backspace key
        if (char === '\b' || char === '\x7f') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b'); // Delete one character
          }
          return;
        }

        // Ignore control characters
        if (char < ' ') {
          return;
        }

        // Add character to password
        password += char;
        process.stdout.write('*');
      });
    });
  }
}
