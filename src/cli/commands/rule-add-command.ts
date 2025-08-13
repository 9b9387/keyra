/**
 * @file rule-add-command.ts
 * @description CLI command for adding a new password rule
 * @author 9b9387
 * @date 2025-04-01
 */

import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { KeyraRule, DEFAULT_RULE } from '../../lib';

/**
 * Rule Add Command Class - For adding new rules
 */
export class RuleAddCommand extends BaseCommand {
  constructor() {
    super('rule:add', 'Add a new password rule');
  }

  /**
   * Configure command
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .action((options) => this.execute(options));
  }

  /**
   * Execute command
   */
  private execute(options: any): void {
    this.interactiveMode();
  }

  /**
   * Interactive mode
   */
  private interactiveMode(): void {
    console.log('\nAdd New Rule');
    this.promptForRuleDetails(DEFAULT_RULE);
  }

  /**
   * Prompt user for rule details
   */
  private async promptForRuleDetails(rule: KeyraRule): Promise<void> {
    try {
      console.log('\nPlease enter rule details (press Enter for default values):');
      // Collect rule name
      const name = await this.askQuestion('Rule name: ');

      if (!name) {
        console.log('Rule name cannot be empty, please try again.');
        return;
      }

      const rules = this.ruleManager.getAllRules();
      const existingRule = rules.find((r: KeyraRule) => r.name === name);

      if (existingRule) {
        console.log('Rule name already exists, please use another name.');
        return;
      }

      // Collect maximum length
      const lengthStr = await this.askQuestion(`Length [${rule.length}]: `);
      let length = lengthStr.trim() ? parseInt(lengthStr, 10) : rule.length;
      if (isNaN(length)) {
        console.log('Length must be a number.');
        return;
      }
      if (length < 4) {
        console.log('Length too small, set to minimum value 4.');
        length = 4;
      } else if (length > 4096) {
        console.log('Length too large, set to maximum value 4096.');
        length = 4096;
      }

      // Collect uppercase requirement
      const requireUppercaseStr = await this.askQuestion(
        `Require uppercase letters (y/n) [${rule.requireUppercase ? 'y' : 'n'}]: `,
      );
      const requireUppercase = requireUppercaseStr.trim()
        ? requireUppercaseStr.toLowerCase() === 'y'
        : rule.requireUppercase;

      // Collect lowercase requirement
      const requireLowercaseStr = await this.askQuestion(
        `Require lowercase letters (y/n) [${rule.requireLowercase ? 'y' : 'n'}]: `,
      );
      const requireLowercase = requireLowercaseStr.trim()
        ? requireLowercaseStr.toLowerCase() === 'y'
        : rule.requireLowercase;

      // Collect numbers requirement
      const requireNumbersStr = await this.askQuestion(
        `Require numbers (y/n) [${rule.requireNumbers ? 'y' : 'n'}]: `,
      );
      const requireNumbers = requireNumbersStr.trim()
        ? requireNumbersStr.toLowerCase() === 'y'
        : rule.requireNumbers;

      // Collect symbols requirement
      const requireSymbolsStr = await this.askQuestion(
        `Require special symbols (y/n) [${rule.requireSymbols ? 'y' : 'n'}]: `,
      );
      const requireSymbols = requireSymbolsStr.trim()
        ? requireSymbolsStr.toLowerCase() === 'y'
        : rule.requireSymbols;

      let allowedSymbols = '';
      if (requireSymbols) {
        // Collect allowed special symbols
        const allowedSymbolsStr = await this.askQuestion(
          `Allowed special symbols [${rule.allowedSymbols}]: `,
        );
        allowedSymbols = allowedSymbolsStr.trim() ? allowedSymbolsStr : rule.allowedSymbols;
      }
      // Create and save the updated rule
      const updatedRule = new KeyraRule(
        name,
        length,
        requireUppercase,
        requireLowercase,
        requireNumbers,
        requireSymbols,
        allowedSymbols,
      );

      this.ruleManager.addRule(updatedRule);
      console.log(`Rule "${updatedRule.name}" has been saved successfully.`);
    } catch (error) {
      console.error('Error occurred while adding rule:', error);
    }
  }
}
