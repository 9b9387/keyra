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
    this.program.name('keyra');
    this.program.description(
      `Keyra — Stateless password generator.

Combines your master password with a service name to create strong,
unique, repeatable passwords for each site or application.`,
    );
    this.program.version(packageJson.version); // Dynamically read version from package.json

    this.program.commandsGroup('Password Commands:');
    new GenerateCommand().configure(this.program);
    new GetCommand().configure(this.program);
    new RotateCommand().configure(this.program);
    new ListCommand().configure(this.program);
    new DeleteCommand().configure(this.program);

    this.program.commandsGroup('Rule Commands:');
    new RuleListCommand().configure(this.program);
    new RuleAddCommand().configure(this.program);
    new RuleDeleteCommand().configure(this.program);

    this.program.configureHelp({
      subcommandDescription(cmd) {
        const s = cmd.description();
        return s ? s[0].toUpperCase() + s.slice(1) : '';
      },
      commandDescription(cmd) {
        const s = cmd.description();
        return s ? s[0].toUpperCase() + s.slice(1) : '';
      },
      optionDescription(opt) {
        const d = opt.description || '';
        return d ? d[0].toUpperCase() + d.slice(1) : '';
      },
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
