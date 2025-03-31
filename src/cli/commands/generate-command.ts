import { Command } from 'commander';
import { BaseCommand } from './base-command';
import * as readline from 'readline';
import { KeyraRule, KeyraData, DEFAULT_RULE } from '../../keyra';
import { DataManager } from '../managers/data-manager';

/**
 * Password generation command class
 */
export class GenerateCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('gen', 'generate a new password');
    this.dataManager = new DataManager();
  }

  /**
   * Configure command
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<serviceName>', 'Name of the service to generate password')
      .option('-r, --rule <ruleName>', 'Use specified rule name')
      .option('-p, --password <masterPassword>', 'Master password')
      .action((serviceName, options) => this.execute(serviceName, options));
  }

  /**
   * Execute command
   */
  private async execute(serviceName: string, options: any): Promise<void> {
    // Check if service name already exists
    if (this.dataManager.hasService(serviceName)) {
      console.error(`Error: Service name "${serviceName}" already exists.`);
      process.exit(1);
    }
    
    // Prioritize the password provided in command line, then use the one from environment variable
    let masterPassword = options.password || process.env.KEYRA_MASTER_PASSWORD;
    
    // If no master password is provided, prompt the user to enter it
    if (!masterPassword) {
      masterPassword = await this.askPassword('Enter master password: ');
      if (!masterPassword) {
        console.error('Error: Master password is required.');
        process.exit(1);
      }
    }
    
    // Determine which rule to use:
    // 1. If -r parameter is provided, try to get that rule
    // 2. If that rule doesn't exist or -r is not provided, use default rule
    let rule: KeyraRule;
    if (options.rule) {
      rule = this.ruleManager.getRule(options.rule) || DEFAULT_RULE;
    } else {
      rule = DEFAULT_RULE;
    }
    
    const keyraData = new KeyraData(serviceName, 1, rule);
    const password = this.passwordGenerator.generate(masterPassword, keyraData);
    console.log(password);
    
    // Save data locally
    this.dataManager.addData(keyraData);
  }

  /**
   * Ask user for password input
   */
  private askPassword(question: string): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }
}