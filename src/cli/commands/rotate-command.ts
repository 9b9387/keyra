/**
 * @file rotate-command.ts
 * @description CLI command for rotating service passwords.
 * @author 9b9387
 * @date 2025-04-01
 */
import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';
import { KeyraData } from '../../lib/keyra-data';

/**
 * Rotate Password Command - Used to update service password and increment version number
 */
export class RotateCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('rotate', 'Rotate password and increment version number');
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
      .argument('<service>', 'Service name for password rotation')
      .action(async (serviceName: string) => {
        await this.execute(serviceName);
      });
  }

  /**
   * Execute password rotation command
   * @param serviceName Service name
   */
  private async execute(serviceName: string): Promise<void> {
    try {
      // Check if service exists
      const existingData = this.dataManager.getData(serviceName);
      if (!existingData) {
        console.error(`No password data found for service: "${serviceName}".`);
        return;
      }

      // Create new data object with version number incremented
      const newData = new KeyraData(
        existingData.serviceName,
        existingData.version + 1,
        existingData.rule,
        existingData.note,
        new Date(),
        existingData.domain,
      );

      // Save new data
      this.dataManager.addData(newData);

      console.log(`Service "${serviceName}" rotated successfully, new version: ${newData.version}`);
    } catch (error: any) {
      console.error(`Error rotating password: ${error?.message || 'Unknown error'}`);
    }
  }
}
