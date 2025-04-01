import { Command } from 'commander';
import { GenerateCommand } from './commands/generate-command';
import { RuleListCommand } from './commands/rule-list-command';
import { RuleAddCommand } from './commands/rule-add-command';
import { RuleDeleteCommand } from './commands/rule-delete-command';
import { ListCommand } from './commands/list-command';
import { DeleteCommand } from './commands/delete-command';
import { GetCommand } from './commands/get-command';
import { RotateCommand } from './commands/rotate-command';
import packageJson from '../../package.json';

/**
 * CLI类 - 提供命令行交互界面
 */
export class CLI {
  private program: Command;
  private commands: any[];

  constructor() {
    this.program = new Command();
    this.commands = [
      new GenerateCommand(),
      new GetCommand(),
      new ListCommand(),
      new DeleteCommand(),
      new RotateCommand(),
      new RuleListCommand(),
      new RuleAddCommand(),
      new RuleDeleteCommand()
    ];

    this.setup();
  }

  /**
   * 设置CLI
   */
  private setup(): void {
    this.program
      .name('keyra')
      .description('Keyra is a stateless password generator that uses your master password and service name to create strong, unique, and repeatable passwords for every website.')
      .version(packageJson.version); // Dynamically read version from package.json

    // 注册所有命令
    this.commands.forEach(command => {
      command.configure(this.program);
    });
  }

  /**
   * 启动CLI
   */
  public start(): void {
    try {
      this.program.parse(process.argv);

      // 如果没有提供任何命令，显示帮助信息
      if (!process.argv.slice(2).length) {
        this.program.outputHelp();
      }
    } catch (error) {
      console.error('Keyra Error:', error);
      process.exit(1);
    }
  }
}
