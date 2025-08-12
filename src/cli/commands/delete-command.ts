/**
 * @file delete-command.ts
 * @description CLI command for deleting saved service password data.
 * @author 9b9387
 * @date 2025-03-31
 */

import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';

/**
 * Delete Command - Used to delete saved service password data
 */
export class DeleteCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('delete', 'Remove stored password data for the given service');
    this.dataManager = new DataManager();
  }

  /**
   * Configure delete command
   * @param program Commander program instance
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<service>', 'Name of the service to delete')
      .action(async (serviceName: string) => {
        await this.executeDelete(serviceName);
      });
  }

  /**
   * Execute delete operation
   * @param serviceName Service name
   */
  private async executeDelete(serviceName: string): Promise<void> {
    const data = this.dataManager.getData(serviceName);
    if (!data) {
      console.log(`No data found for service: "${serviceName}".`);
      return;
    }

    // Execute delete operation
    const result = this.dataManager.deleteData(serviceName);
    if (result) {
      console.log(`Successfully deleted data for service: "${serviceName}".`);
    } else {
      console.log(`Failed to delete data for service: "${serviceName}".`);
    }
  }
}
