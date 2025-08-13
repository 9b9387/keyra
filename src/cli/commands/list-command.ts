/**
 * @file list-command.ts
 * @description CLI command for listing all saved service entries
 * @author 9b9387
 * @date 2025-03-31
 */
import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';

/**
 * List Command - Lists all saved service data
 */
export class ListCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('list', 'Show all stored service entries');
    this.dataManager = new DataManager();
  }

  /**
   * Configure command
   * @param program Commander program instance
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .action(() => {
        this.execute();
      });
  }

  /**
   * Format date as YYYY-MM-DD HH:MM:SS with zero padding
   * @param date Date object to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  }

  /**
   * Execute command
   */
  private execute(): void {
    const allData = this.dataManager.getAllData();

    if (allData.length === 0) {
      console.log('No service data saved');
      return;
    }

    // Sort by service name
    allData.sort((a, b) => a.serviceName.localeCompare(b.serviceName));

    // Prepare table rows
    const rows = allData.map((d) => ({
      service: d.serviceName,
      version: String(d.version || 1),
      rule: d.rule?.name || 'N/A',
      created: this.formatDate(d.createDate),
      domain: d.domain || '-',
      note: (d.note || '').replace(/\s+/g, ' ').trim() || '-',
    }));

    // Truncate long note & domain for readability
    const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1) + '…' : s);
    rows.forEach((r) => {
      r.note = truncate(r.note, 30);
      r.domain = truncate(r.domain, 20);
    });

    const headers = {
      service: 'Service',
      version: 'Version',
      rule: 'Rule',
      created: 'Created',
    };

    // Compute column widths
    const colWidth = (key: keyof typeof headers) =>
      Math.max(headers[key].length, ...rows.map((r) => (r[key] as string).length));

    const widths = {
      service: colWidth('service'),
      version: colWidth('version'),
      rule: colWidth('rule'),
      created: colWidth('created'),
    };

    const pad = (value: string, len: number) => value.padEnd(len, ' ');

    const headerLine = [
      pad(headers.service, widths.service),
      pad(headers.version, widths.version),
      pad(headers.rule, widths.rule),
      pad(headers.created, widths.created),
    ].join('  ');

    const sepLine = [
      '-'.repeat(widths.service),
      '-'.repeat(widths.version),
      '-'.repeat(widths.rule),
      '-'.repeat(widths.created),
    ].join('  ');

    console.log(`\nSaved Service List (${rows.length}):\n`);
    console.log(headerLine);
    console.log(sepLine);

    rows.forEach((r) => {
      const line = [
        pad(r.service, widths.service),
        pad(r.version, widths.version),
        pad(r.rule, widths.rule),
        pad(r.created, widths.created),
      ].join('  ');
      console.log(line);
    });

    console.log();
  }
}
