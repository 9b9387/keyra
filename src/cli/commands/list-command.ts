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
   * Execute command
   */
  private execute(): void {
    const allData = this.dataManager.getAllData();

    if (allData.length === 0) {
      console.log('No service data saved');
      return;
    }

    // Create table header
    console.log('\nSaved Service List:\n');

    // Display data
    allData.forEach((data) => {
      console.log(`${data.serviceName} - ${data.createDate.toLocaleString()}`);
    });
  }
}
