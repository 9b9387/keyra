/**
 * @file rule-delete-command.ts
 * @description CLI command for list all password rules
 * @author 9b9387
 * @date 2025-03-31
 */

import { Command } from 'commander';
import { BaseCommand } from './base-command';

/**
 * Rule List Command - For viewing all rules
 */
export class RuleListCommand extends BaseCommand {
  constructor() {
    super('rule:list', 'Show all password rules');
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

    if (!rules.length) {
      console.log('\nNo rules found.\n');
      return;
    }

    // Normalize rules (string => { name: value })
    const normalized: Record<string, any>[] = rules.map((r: any) =>
      typeof r === 'string' ? { name: r } : r && typeof r === 'object' ? r : { name: String(r) },
    );

    // Collect keys present
    const allKeys = new Set<string>();
    normalized.forEach((r) => Object.keys(r).forEach((k) => allKeys.add(k)));

    // Desired order (provided)
    const desiredOrder = [
      'name',
      'length',
      'requireLowercase',
      'requireNumbers',
      'requireUppercase',
      'requireSymbols',
      'allowedSymbols',
    ];

    // Simplified header names
    const headerNames: Record<string, string> = {
      name: 'Name',
      length: 'Length',
      requireLowercase: 'Lower',
      requireNumbers: 'Numbers',
      requireUppercase: 'Uppercase',
      requireSymbols: 'Symbols',
      allowedSymbols: 'Allowed Symbols',
    };

    // Build ordered columns: desired (if exists) + remaining (alphabetical)
    const columns = [
      ...desiredOrder.filter((k) => allKeys.has(k)),
      ...Array.from(allKeys)
        .filter((k) => !desiredOrder.includes(k))
        .sort(),
    ];

    const formatValue = (v: any): string => {
      if (v === null || v === undefined) return '-';
      if (typeof v === 'boolean') return v ? 'Y' : 'N';
      if (v instanceof Date) return v.toISOString();
      if (Array.isArray(v)) return v.join(',');
      if (typeof v === 'object') return JSON.stringify(v);
      return String(v);
    };

    const rows = normalized.map((r) => columns.map((c) => formatValue(r[c])));

    const widths = columns.map((c, i) =>
      Math.max((headerNames[c] || c).length, ...rows.map((row) => row[i].length)),
    );

    const pad = (s: string, len: number) => s.padEnd(len, ' ');

    console.log(`\nPassword Rules (${rows.length}):\n`);

    const headerLine = columns
      .map((c, i) => pad(headerNames[c] || c.replace(/^./, (x) => x.toUpperCase()), widths[i]))
      .join('  ');
    const sepLine = widths.map((w) => '-'.repeat(w)).join('  ');
    console.log(headerLine);
    console.log(sepLine);

    rows.forEach((row) => {
      console.log(row.map((v, i) => pad(v, widths[i])).join('  '));
    });

    console.log();
  }
}
