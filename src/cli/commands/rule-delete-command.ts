import { Command } from 'commander';
import { BaseCommand } from './base-command';
import * as readline from 'readline';

/**
 * Rule Delete Command Class - Used to delete existing rules
 */
export class RuleDeleteCommand extends BaseCommand {
  constructor() {
    super('rule:delete', 'delete an existing password rule');
  }

  /**
   * Configure command
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<ruleName>', 'Name of the rule to delete')
      .option('-f, --force', 'Force delete without confirmation')
      .action((ruleName: string, options: { force?: boolean }) => this.execute(ruleName, options.force));
  }

  /**
   * Execute command
   */
  private execute(ruleName: string, force?: boolean): void {
    if (ruleName) {
      // If a name parameter is provided, try to delete the specified rule
      this.deleteRuleByName(ruleName, force);
    }
  }

  /**
   * Delete rule by name
   */
  private deleteRuleByName(ruleName: string, force?: boolean): void {
    if (ruleName === 'default') {
      console.log('Default rule cannot be deleted.');
      return;
    }

    const rule = this.ruleManager.getRule(ruleName);
    if (rule == null || rule.name !== ruleName) {
      console.log(`Rule "${ruleName}" does not exist.`);
      return;
    }

    if (force) {
      // Skip confirmation if force flag is set
      const result = this.ruleManager.deleteRule(ruleName);
      if (result) {
        console.log(`Rule "${ruleName}" has been successfully deleted.`);
      } else {
        console.log(`Failed to delete rule "${ruleName}".`);
      }
      return;
    }

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Are you sure you want to delete rule "${ruleName}"? (y/n): `, (answer) => {
      if (answer.trim().toLowerCase() === 'y') {
        const result = this.ruleManager.deleteRule(ruleName);

        if (result) {
          console.log(`Rule "${ruleName}" has been successfully deleted.`);
        } else {
          console.log(`Failed to delete rule "${ruleName}".`);
        }
      }

      rl.close();
    });
  }
}