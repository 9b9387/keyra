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
      `Keyra — Stateless password generator.\n\nCombines your master password with a service name to create strong,\nunique, repeatable passwords for each site or application.`,
    );
    this.program.version(packageJson.version); // Dynamically read version from package.json

    // 分组 + 注册命令
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

    // 自定义帮助输出
    this.program.configureHelp({
      sortSubcommands: false,
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
      formatHelp: (cmd, helper) => {
        const termWidth = (process.stdout.columns || 100) - 4;
        const wrap = (text: string) => {
          const width = termWidth;
          return text
            .split('\n')
            .map((line) => {
              if (line.length <= width) return line;
              const parts: string[] = [];
              let rest = line;
              while (rest.length > width) {
                let slice = rest.slice(0, width);
                const lastSpace = slice.lastIndexOf(' ');
                if (lastSpace > width * 0.5) slice = slice.slice(0, lastSpace);
                parts.push(slice);
                rest = rest.slice(slice.length).trimStart();
              }
              if (rest) parts.push(rest);
              return parts.join('\n');
            })
            .join('\n');
        };

        const all = cmd.commands as Command[]; // ignore hidden flag (private api)
        const pwdCmds = all.filter((c) => !c.name().startsWith('rule'));
        const ruleCmds = all.filter((c) => c.name().startsWith('rule'));

        const renderCmds = (list: Command[]) =>
          list.map((c) => `  ${c.name().padEnd(22)}${c.description()}`).join('\n');

        const header = `\n  Keyra v${packageJson.version}  Stateless password manager`;
        const description = `\n  Combines your master password with a service name to create strong,\nunique, repeatable passwords for each site or application.`;
        const usage = `\nUsage:\n  keyra <command> [options]`;
        const pwdBlock = pwdCmds.length ? `\nPassword Commands:\n${renderCmds(pwdCmds)}` : '';
        const ruleBlock = ruleCmds.length ? `\nRule Commands:\n${renderCmds(ruleCmds)}` : '';

        const optionsList = helper
          .visibleOptions(cmd)
          .map((o) => `  ${helper.optionTerm(o).padEnd(22)}${helper.optionDescription(o)}`)
          .join('\n');
        const optionsBlock = optionsList ? `\nGlobal Options:\n${optionsList}` : '';

        const footer = `\nGitHub: https://github.com/9b9387/keyra\n`;

        return [header, description, usage, pwdBlock, ruleBlock, optionsBlock, footer]
          .filter(Boolean)
          .map((block) => wrap(block))
          .join('\n');
      },
    });
  }

  /**
   * 启动CLI
   */
  public start(): void {
    try {
      this.program.parse(process.argv);
      if (!process.argv.slice(2).length) {
        this.program.outputHelp();
      }
    } catch (error) {
      console.error('Keyra Error:', error);
      process.exit(1);
    }
  }
}
