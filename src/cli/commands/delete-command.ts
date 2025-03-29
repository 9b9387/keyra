import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';
import * as readline from 'readline';

/**
 * Delete Command - Used to delete saved service password data
 */
export class DeleteCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('delete', 'remove a saved service entry');
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
      .argument('<serviceName>', 'Name of the service to delete')
      .option('-f, --force', 'Force delete without confirmation')
      .action(async (serviceName: string, options) => {
        await this.executeDelete(serviceName, options.force);
      });
  }

  /**
   * Execute delete operation
   * @param serviceName Service name
   * @param force Whether to force delete
   */
  private async executeDelete(serviceName: string, force: boolean = false): Promise<void> {
    const data = this.dataManager.getData(serviceName);
    if (!data) {
      console.log(`Service data named "${serviceName}" not found`);
      return;
    }

    // If not force delete, ask for user confirmation
    if (!force) {
      const confirmed = await this.confirmDeletion(serviceName);
      if (!confirmed) {
        console.log('Delete operation cancelled');
        return;
      }
    }

    // Execute delete operation
    const result = this.dataManager.deleteData(serviceName);
    if (result) {
      console.log(`Successfully deleted data for "${serviceName}"`);
    } else {
      console.log(`Failed to delete data for "${serviceName}"`);
    }
  }

  /**
   * Confirm deletion operation
   * @param serviceName Name of the service to delete
   * @returns Whether deletion is confirmed
   */
  private async confirmDeletion(serviceName: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      const answer = await this.askQuestion(
        rl,
        `Are you sure you want to delete data for "${serviceName}"? (y/n): `
      );
      return answer.toLowerCase() === 'y';
    } finally {
      rl.close();
    }
  }
}
