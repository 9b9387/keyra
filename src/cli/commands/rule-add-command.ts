import { Command } from "commander";
import { BaseCommand } from "./base-command";
import * as readline from "readline";
import { KeyraRule, DEFAULT_RULE } from "../../keyra";

/**
 * Rule Add Command Class - For adding new rules
 */
export class RuleAddCommand extends BaseCommand {
  constructor() {
    super("rule:add", "add a new password rule");
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
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\nAdd New Rule");
    this.promptForRuleDetails(rl, DEFAULT_RULE);
  }

  /**
   * Prompt user for rule details
   */
  private async promptForRuleDetails(
    rl: readline.Interface,
    rule: KeyraRule
  ): Promise<void> {
    try {
      console.log("\nPlease enter rule details (press Enter for default values):");
      // Collect rule name
      const name = await this.askQuestion(rl, "Rule name: ");
      
      if (!name) {
        console.log("Rule name cannot be empty, please try again.");
        rl.close();
        return;
      }

      const rules = this.ruleManager.getAllRules();
      const existingRule = rules.find((r:KeyraRule) => r.name === name);

      if (existingRule) {
        console.log("Rule name already exists, please use another name.");
        rl.close();
        return;
      }

      // Collect maximum length
      const lengthStr = await this.askQuestion(
        rl,
        `Length [${rule.length}]: `
      );
      const length = lengthStr.trim()
        ? parseInt(lengthStr, 10)
        : rule.length;

      // Collect uppercase requirement
      const requireUppercaseStr = await this.askQuestion(
        rl,
        `Require uppercase letters (y/n) [${rule.requireUppercase ? "y" : "n"}]: `
      );
      const requireUppercase = requireUppercaseStr.trim()
        ? requireUppercaseStr.toLowerCase() === "y"
        : rule.requireUppercase;

      // Collect lowercase requirement
      const requireLowercaseStr = await this.askQuestion(
        rl,
        `Require lowercase letters (y/n) [${rule.requireLowercase ? "y" : "n"}]: `
      );
      const requireLowercase = requireLowercaseStr.trim()
        ? requireLowercaseStr.toLowerCase() === "y"
        : rule.requireLowercase;

      // Collect numbers requirement
      const requireNumbersStr = await this.askQuestion(
        rl,
        `Require numbers (y/n) [${rule.requireNumbers ? "y" : "n"}]: `
      );
      const requireNumbers = requireNumbersStr.trim()
        ? requireNumbersStr.toLowerCase() === "y"
        : rule.requireNumbers;

      // Collect symbols requirement
      const requireSymbolsStr = await this.askQuestion(
        rl,
        `Require special symbols (y/n) [${rule.requireSymbols ? "y" : "n"}]: `
      );
      const requireSymbols = requireSymbolsStr.trim()
        ? requireSymbolsStr.toLowerCase() === "y"
        : rule.requireSymbols;

      let allowedSymbols = "";
      if (requireSymbols) {
        // Collect allowed special symbols
        const allowedSymbolsStr = await this.askQuestion(
          rl,
          `Allowed special symbols [${rule.allowedSymbols}]: `
        );
        allowedSymbols = allowedSymbolsStr.trim()
          ? allowedSymbolsStr
          : rule.allowedSymbols;
      }
      // Create and save the updated rule
      const updatedRule = new KeyraRule(
        name,
        length,
        requireUppercase,
        requireLowercase,
        requireNumbers,
        requireSymbols,
        allowedSymbols
      );

      this.ruleManager.addRule(updatedRule);
      console.log(`Rule "${updatedRule.name}" has been saved successfully.`);
    } catch (error) {
      console.error("Error occurred while adding rule:", error);
    } finally {
      rl.close();
    }
  }
}
