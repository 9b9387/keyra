import { Command } from 'commander';
import { BaseCommand } from './base-command';
import { DataManager } from '../managers/data-manager';
import { KeyraData } from '../../keyra/keyra-data';

/**
 * Get Password Command Class
 */
export class GetCommand extends BaseCommand {
  private dataManager: DataManager;

  constructor() {
    super('get', 'retrieve the password for a service');
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
      .argument('<serviceName>', 'Service name')
      .option('-d, --detail', 'Show detailed information', false)
      .option('-h, --history', 'Show password history', false)
      .option('-p, --password <password>', 'Set master password', '')
      .action(async (serviceName: string, options: { detail: boolean, history: boolean, password: string }) => {
        await this.execute(serviceName, options);
      });
  }

  /**
   * Execute password retrieval logic
   * @param serviceName Service name
   * @param options Command options
   */
  private async execute(serviceName: string, options: { detail: boolean, history: boolean, password: string }): Promise<void> {
    try {
      // Get service data
      const data = this.dataManager.getData(serviceName);
      if (!data) {
        console.error(`Error: Password data for service "${serviceName}" not found`);
        return;
      }

      // Get master password, prioritize command line option, then environment variable, then user input
      let masterPassword = '';
      if (options.password) {
        masterPassword = options.password;
      } else {
        masterPassword = process.env.KEYRA_MASTER_PASSWORD || await this.getMasterPasswordFromUser();
      }
      
      if (!masterPassword) {
        console.error('Error: Master password not provided, cannot generate password');
        return;
      }

      if (options.history) {
        // Show password history
        await this.displayPasswordHistory(masterPassword, serviceName, options.detail);
      } else {
        // Generate current password
        const password = this.passwordGenerator.generate(masterPassword, data);

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
  private async displayPasswordHistory(masterPassword: string, serviceName: string, detail: boolean): Promise<void> {
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
        const password = this.passwordGenerator.generate(masterPassword, data);
        
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
