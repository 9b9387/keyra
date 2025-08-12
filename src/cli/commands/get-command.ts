/**
 * @file get-command.ts
 * @description CLI command for retrieving passwords and password history for a service
 * @author 9b9387
 * @date 2025-04-01
 */

import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';
import { KeyraData } from '../../lib/keyra-data';

/**
 * Get Password Command Class
 */
export class GetCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('get', 'Retrieve the password for the given service');
    this.dataManager = new DataManager();
  }

  /**
   * Configure command parameters
   * @param program Commander program instance
   */
  public configure(program: Command): void {
    program
      .command(this.name)
      .description(this.description)
      .argument('<service>', 'Service name')
      .option('-d, --detail', 'Show detailed information')
      .option('-v, --versions', 'Show password history')
      .option('-p, --password <password>', 'Set master password')
      .action(
        async (
          serviceName: string,
          options: { detail: boolean; versions: boolean; password: string },
        ) => {
          await this.execute(serviceName, options);
        },
      );
  }

  /**
   * Execute password retrieval logic
   * @param serviceName Service name
   * @param options Command options
   */
  private async execute(
    serviceName: string,
    options: { detail: boolean; versions: boolean; password: string },
  ): Promise<void> {
    try {
      // Get service data
      const data = this.dataManager.getData(serviceName);
      if (!data) {
        console.error(`Error: Password data for service "${serviceName}" not found`);
        return;
      }

      let masterPassword = options.password || process.env.KEYRA_MASTER_PASSWORD;

      // If no master password is provided, prompt the user to enter it
      if (!masterPassword) {
        masterPassword = await this.askQuestion('Enter master password: ');
        if (!masterPassword) {
          console.error('Master password is required. Operation aborted.');
          process.exit(1);
        }
      }

      if (options.versions) {
        // Show password history
        await this.displayPasswordVersions(masterPassword, serviceName, options.detail);
      } else {
        // Generate current password
        const password = await this.passwordGenerator.generate(masterPassword, data);

        // Display password
        console.log(`${password}\n`);

        // Show detailed information
        if (options.detail) {
          this.displayVerboseInfo(data);
        }
      }
    } catch (error: any) {
      console.error(`Error retrieving password: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Display password history for a service
   * @param masterPassword Master password
   * @param serviceName Service name
   * @param currentData Current service data
   * @param detail Whether to show detailed information
   */
  private async displayPasswordVersions(
    masterPassword: string,
    serviceName: string,
    detail: boolean,
  ): Promise<void> {
    try {
      // Get service history data
      const historyData = this.dataManager.getServiceHistory(serviceName);
      if (!historyData || historyData.length === 0) {
        console.log(`Service "${serviceName}" has no password history records`);
        return;
      }

      // Show historical passwords, including current version
      for (let i = 0; i < historyData.length; i++) {
        const data = historyData[i];
        const password = await this.passwordGenerator.generate(masterPassword, data);

        console.log(`v${data.version}: ${password}`);

        // Only show detailed information if detail is true
        if (detail) {
          // Reuse displayVerboseInfo method
          console.log('');
          this.displayVerboseInfo(data, ''); // Add indentation to maintain format
        }
      }
    } catch (error: any) {
      console.error(`Error retrieving password history: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Display detailed information
   * @param data Password data
   * @param prefix Prefix for indentation
   */
  private displayVerboseInfo(data: KeyraData, prefix: string = ''): void {
    console.log(`${prefix}Details:`);
    console.log(`${prefix}- Service Name: ${data.serviceName}`);
    console.log(`${prefix}- Version: ${data.version}`);
    console.log(`${prefix}- Created: ${data.createDate.toLocaleString()}`);

    if (data.domain) {
      console.log(`${prefix}- Domain: ${data.domain}`);
    }

    if (data.note) {
      console.log(`${prefix}- Note: ${data.note}`);
    }

    console.log(`- ${data.rule}`);
    console.log('');
  }
}
