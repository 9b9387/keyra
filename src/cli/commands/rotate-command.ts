import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';
import { KeyraData } from '../../lib/keyra-data';
import * as readline from 'readline';

/**
 * Rotate Password Command - Used to update service password and increment version number
 */
export class RotateCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('rotate', 'rotate a service password and increment version number');
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
      .argument('<serviceName>', 'Service name for password rotation')
      .option('-f, --force', 'Force execution without confirmation prompt')
      .action(async (serviceName: string, options) => {
        await this.execute(serviceName, options);
      });
  }

  /**
   * Execute password rotation command
   * @param serviceName Service name
   * @param options Command options
   */
  private async execute(serviceName: string, options: { force?: boolean }): Promise<void> {
    try {
      // Check if service exists
      const existingData = this.dataManager.getData(serviceName);
      if (!existingData) {
        console.error(`Error: Password data for service "${serviceName}" not found`);
        return;
      }

      console.log(`\nRotating password for "${serviceName}"`);
      console.log(`Current version: v${existingData.version}`);
        // Display existing data's date
        console.log(`Created date: ${existingData.createDate.toLocaleString()}`);
      // Request confirmation if not forced
      if (!options.force) {
        const confirmed = await this.confirmRotation(serviceName);
        if (!confirmed) {
          console.log('Rotation operation cancelled');
          return;
        }
      }

      // Create new data object with version number incremented
      const newData = new KeyraData(
        existingData.serviceName,
        existingData.version + 1,
        existingData.rule,
        existingData.note,
        new Date(),
        existingData.domain
      );

      // Save new data
      this.dataManager.addData(newData);

      console.log(`\nPassword rotated to version: v${newData.version}`);
    } catch (error: any) {
      console.error(`Error rotating password: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Request user confirmation for rotation
   * @param serviceName Service name
   * @returns Whether confirmed
   */
  private async confirmRotation(serviceName: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      const answer = await this.askQuestion(
        rl,
        `\nAre you sure you want to rotate the password for "${serviceName}"? (y/n): `
      );
      return answer.toLowerCase() === 'y';
    } finally {
      rl.close();
    }
  }
}
