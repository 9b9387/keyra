/**
 * @file generate-command.ts
 * @description CLI command for generating new service password data.
 * @author 9b9387
 * @date 2025-04-01
 */

import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { KeyraRule, KeyraData, DEFAULT_RULE } from '../../lib';
import { DataManager } from '../managers/data-manager';

/**
 * Password generation command class
 */
export class GenerateCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('gen', 'Generate a password for the given service');
    this.dataManager = new DataManager();
  }

  /**
   * Configure command
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<service>', 'The name of the service (e.g., github, gmail)')
      .option('-r, --rule <rule>', 'Specify a password generation rule')
      .option(
        '-p, --password <masterPassword>',
        'Master password (can also use KEYRA_MASTER_PASSWORD env variable)',
      )
      .option('-s, --save', 'Save the generated service and rule locally')
      .action((serviceName, options) => this.execute(serviceName, options));
  }

  /**
   * Execute command
   */
  private async execute(serviceName: string, options: any): Promise<void> {
    // Check if service name already exists
    if (this.dataManager.hasService(serviceName)) {
      console.error(`Service "${serviceName}" already exists. Please choose a different name.`);
      process.exit(1);
    }

    // Prioritize the password provided in command line, then use the one from environment variable
    let masterPassword = options.password || process.env.KEYRA_MASTER_PASSWORD;

    // If no master password is provided, prompt the user to enter it
    if (!masterPassword) {
      masterPassword = await this.askQuestion('Enter master password: ');
      if (!masterPassword) {
        console.error('Master password is required. Operation aborted.');
        process.exit(1);
      }
    }

    // Determine which rule to use
    let rule: KeyraRule = options.rule
      ? this.ruleManager.getRule(options.rule) || DEFAULT_RULE
      : DEFAULT_RULE;

    const keyraData = new KeyraData(serviceName, 1, rule);
    const password = await this.passwordGenerator.generate(masterPassword, keyraData);
    console.log(`\n${password}`);

    if (options.save) {
      this.dataManager.addData(keyraData);
      console.log(`Service "${serviceName}" has been saved.`);
    }
  }
}
