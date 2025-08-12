/**
 * @file rule-delete-command.ts
 * @description CLI command for deleting a password rule
 * @author 9b9387
 * @date 2025-03-31
 */

import { Command } from 'commander';
import { BaseCommand } from './base-command';

/**
 * Rule Delete Command Class - Used to delete existing rules
 */
export class RuleDeleteCommand extends BaseCommand {
  constructor() {
    super('rule:delete', 'Remove a password rule by name');
  }

  /**
   * Configure command
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<rule>', 'Name of the rule to delete')
      .action((ruleName: string) => this.execute(ruleName));
  }

  /**
   * Execute command
   */
  private execute(ruleName: string): void {
    if (ruleName) {
      this.deleteRuleByName(ruleName);
    }
  }

  /**
   * Delete rule by name
   */
  private deleteRuleByName(ruleName: string): void {
    if (ruleName === 'default') {
      console.log('The default rule cannot be deleted.');
      return;
    }

    const rule = this.ruleManager.getRule(ruleName);
    if (rule == null || rule.name !== ruleName) {
      console.log(`Rule "${ruleName}" does not exist.`);
      return;
    }

    const result = this.ruleManager.deleteRule(ruleName);
    if (result) {
      console.log(`Rule "${ruleName}" deleted successfully.`);
    } else {
      console.log(`Failed to delete rule "${ruleName}".`);
    }
  }
}
