import { Command } from 'commander';
import { BaseCommand } from './base-command';

/**
 * Rule List Command - For viewing all rules
 */
export class RuleListCommand extends BaseCommand {
  constructor() {
    super('rule:list', 'display all password rules');
  }

  /**
   * Configure command
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .action(() => this.execute());
  }

  /**
   * Execute command
   */
  private execute(): void {
    const rules = this.ruleManager.getAllRules();

    console.log('\nCurrent Configuration:\n');

    if (rules.length === 0) {
      console.log('No rules found.');
    } else {
      rules.forEach((rule, index) => {
        console.log(`[${index + 1}] ${rule}`);
        console.log('');
      });
    }
  }
}