import * as path from 'path';
import * as os from 'os';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { exec, execSync } from 'child_process';
import * as readline from 'readline';

interface GitConfig {
  url: string;
  branch: string;
  enabled: boolean;
  sshKeyPath?: string;
}

/**
 * Git管理器类 - 负责git相关操作及同步
 */
export class GitManager {
  private configPath: string;
  private keyraDir: string;
  private config: GitConfig | null = null;
  private initialized: boolean = false;

  // 缓存远程分支存在状态以提高性能
  private remoteBranchCache: Map<string, { exists: boolean; timestamp: number }> = new Map();
  private cacheTTL: number = 60000; // 缓存有效期为1分钟

  constructor() {
    this.keyraDir = path.join(os.homedir(), '.keyra');
    this.configPath = path.join(this.keyraDir, 'git.config.json');
    this.loadConfig();
  }

  /**
   * 检查初始化状态
   */
  public async checkInitStatus(): Promise<void> {
    // 确保配置存在，git已安装且仓库可访问
    if (!this.config || !this.config.enabled) {
      this.initialized = false;
      return;
    }

    const gitInstalled = await this.isGitInstalled();
    if (!gitInstalled) {
      this.initialized = false;
      return;
    }

    try {
      // 测试git仓库是否可正常使用
      if (!this.isGitRepo()) {
        await this.initRepo(false); // 静默初始化，不打印错误
      }

      // 检查远程仓库是否可访问
      if (this.isGitRepo()) {
        // 简单测试，无需实际拉取
        execSync(`git ls-remote --heads ${this.config.url}`, {
          cwd: this.keyraDir,
          stdio: 'pipe',
          env: this.gitEnv(),
        });
        this.initialized = true;
      } else {
        this.initialized = false;
      }
    } catch (error) {
      this.initialized = false;
      console.error(error);
    }
  }

  /**
   * 获取初始化状态
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * 检查系统是否安装了git
   */
  public async isGitInstalled(): Promise<boolean> {
    try {
      return new Promise<boolean>((resolve) => {
        exec('git --version', (error) => {
          resolve(!error);
        });
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * 加载Git配置
   */
  private loadConfig(): void {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
      }
    } catch (error: any) {
      console.error(`加载Git配置失败: ${error?.message || '未知错误'}`);
      this.config = null;
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): GitConfig | null {
    return this.config;
  }

  /**
   * 检查目录是否已初始化为git仓库
   */
  private isGitRepo(): boolean {
    try {
      return existsSync(path.join(this.keyraDir, '.git'));
    } catch (error) {
      return false;
    }
  }

  /**
   * 初始化Git仓库
   * @param verbose 是否打印错误信息
   */
  public async initRepo(verbose: boolean = true): Promise<boolean> {
    if (!this.config?.url) {
      if (verbose) console.error('Git配置不存在，请先设置Git配置');
      this.initialized = false;
      return false;
    }

    try {
      if (!existsSync(this.keyraDir)) {
        mkdirSync(this.keyraDir, { recursive: true });
      }

      if (!this.isGitRepo()) {
        execSync('git init', { cwd: this.keyraDir, env: this.gitEnv() });
        execSync(`git remote add origin ${this.config.url}`, {
          cwd: this.keyraDir,
          env: this.gitEnv(),
        });
      } else {
        const remoteUrl = execSync('git config --get remote.origin.url', {
          cwd: this.keyraDir,
          encoding: 'utf-8',
          env: this.gitEnv(),
        }).trim();
        if (remoteUrl !== this.config.url) {
          execSync(`git remote set-url origin ${this.config.url}`, {
            cwd: this.keyraDir,
            env: this.gitEnv(),
          });
        }
      }

      this.initialized = true;
      return true;
    } catch (error: any) {
      if (verbose) console.error(`初始化Git仓库失败: ${error?.message || '未知错误'}`);
      this.initialized = false;
      return false;
    }
  }

  /**
   * 检查远程分支是否存在（优化版）
   * @param branch 分支名称，默认使用配置中的分支
   * @returns 分支是否存在
   */
  public async checkRemoteBranchExists(branch?: string): Promise<boolean> {
    const branchName = branch || this.config?.branch;
    if (!branchName || !this.initialized) {
      return false;
    }

    // 检查缓存是否有效
    const now = Date.now();
    const cacheEntry = this.remoteBranchCache.get(branchName);
    if (cacheEntry && now - cacheEntry.timestamp < this.cacheTTL) {
      return cacheEntry.exists;
    }

    try {
      // 使用更高效的命令直接检查特定分支
      const cmd = `git ls-remote --heads origin ${branchName}`;
      const result = execSync(cmd, {
        cwd: this.keyraDir,
        stdio: 'pipe',
        encoding: 'utf-8',
        env: this.gitEnv(),
      })
        .toString()
        .trim();

      // 如果返回结果不为空，说明分支存在
      const exists = result.length > 0;

      // 更新缓存
      this.remoteBranchCache.set(branchName, { exists, timestamp: now });

      return exists;
    } catch (error) {
      console.error('检查远程分支失败');
      return false;
    }
  }

  /**
   * 检查远程是否有更新
   * @returns 如果远程有新的提交，则返回true；否则返回false
   */
  public async hasRemoteUpdates(): Promise<boolean> {
    try {
      // 检查远程分支是否存在
      //   const branchExists = await this.checkRemoteBranchExists();
      //   if (!branchExists) {
      //     return false; // 远程分支不存在，认为无更新
      //   }

      // 使用更高效的方式检查更新 - 只获取远程引用信息而不下载对象
      execSync('git fetch --dry-run', { cwd: this.keyraDir, stdio: 'pipe', env: this.gitEnv() });
      const result = execSync(`git rev-list HEAD..origin/${this.config?.branch} --count`, {
        cwd: this.keyraDir,
        encoding: 'utf-8',
        env: this.gitEnv(),
      }).trim();

      // 如果有至少一个提交差异，则认为有更新
      return parseInt(result) > 0;
    } catch (error: any) {
      console.error(`检查远程更新失败: ${error?.message || '未知错误'}`);
      return false;
    }
  }

  /**
   * 拉取远程变更
   */
  public async pull(): Promise<boolean> {
    console.log('pull');
    if (!this.initialized) {
      return false;
    }

    if (!this.config?.enabled || !this.config?.branch) {
      return false;
    }

    if (!(await this.isGitInstalled())) {
      console.error('系统未安装Git，无法同步');
      this.initialized = false;
      return false;
    }

    if (!this.isGitRepo()) {
      if (!(await this.initRepo())) {
        return false;
      }
    }

    try {
      // 检查是否有本地更改
      const hasChanges =
        execSync('git status --porcelain', {
          cwd: this.keyraDir,
          encoding: 'utf-8',
          env: this.gitEnv(),
        }).trim().length > 0;

      if (hasChanges) {
        // 先提交本地更改
        execSync('git add .', { cwd: this.keyraDir, env: this.gitEnv() });
        execSync('git commit -m "Auto-commit before pull"', {
          cwd: this.keyraDir,
          env: this.gitEnv(),
        });
      }

      // 检查远程分支是否存在
      const branchExists = await this.checkRemoteBranchExists();

      if (!branchExists) {
        console.log(`远程分支 ${this.config.branch} 不存在，将创建该分支并推送本地内容`);

        // 确保本地分支存在
        try {
          execSync(`git checkout -b ${this.config.branch}`, {
            cwd: this.keyraDir,
            stdio: 'pipe',
            env: this.gitEnv(),
          });
        } catch (error) {
          // 如果已经在该分支上，会抛出错误，可以忽略
          execSync(`git checkout ${this.config.branch}`, {
            cwd: this.keyraDir,
            stdio: 'pipe',
            env: this.gitEnv(),
          });
        }

        // 推送到远程，创建远程分支
        execSync(`git push -u origin ${this.config.branch}`, {
          cwd: this.keyraDir,
          stdio: 'pipe',
          env: this.gitEnv(),
        });

        return true;
      }

      try {
        execSync(`git pull origin ${this.config.branch} --no-rebase`, {
          cwd: this.keyraDir,
          stdio: 'pipe',
          env: this.gitEnv(),
        });
        return true;
      } catch (pullError) {
        console.log(pullError);
        // 处理冲突
        return await this.resolveConflicts();
      }
    } catch (error: any) {
      console.error(`拉取远程变更失败: ${error?.message} || '未知错误'`);
      return false;
    }
  }

  /**
   * 推送本地变更到远程
   */
  public async push(): Promise<boolean> {
    console.log('push');
    if (!this.initialized) {
      return false;
    }

    if (!this.config?.enabled || !this.config?.branch) {
      return false;
    }

    if (!(await this.isGitInstalled())) {
      console.error('系统未安装Git，无法同步');
      this.initialized = false;
      return false;
    }

    if (!this.isGitRepo()) {
      if (!(await this.initRepo())) {
        return false;
      }
    }

    try {
      // 检查是否有本地更改
      const hasChanges =
        execSync('git status --porcelain', {
          cwd: this.keyraDir,
          encoding: 'utf-8',
          env: this.gitEnv(),
        }).trim().length > 0;
      console.log(`本地是否有更改: ${hasChanges} ${this.keyraDir}`);
      if (hasChanges) {
        // 添加并提交更改
        execSync('git add .', { cwd: this.keyraDir, env: this.gitEnv() });
        execSync('git commit -m "Auto-sync commit"', { cwd: this.keyraDir, env: this.gitEnv() });
      }

      const aheadCount = execSync(`git rev-list origin/${this.config.branch}..HEAD --count`, {
        cwd: this.keyraDir,
        encoding: 'utf-8',
        env: this.gitEnv(),
      }).trim();

      if (parseInt(aheadCount) === 0) {
        console.log('没有需要推送的提交');
        return true;
      }
      console.log(`推送到远程分支: ${this.config.branch}`);
      // 推送到远程
      execSync(`git push origin ${this.config.branch}`, { cwd: this.keyraDir, env: this.gitEnv() });
      return true;
    } catch (error: any) {
      console.error(`推送本地变更失败: ${error?.message} || '未知错误'`);

      // 如果是因为远程有新的提交，先尝试拉取
      if (error.message && error.message.includes('fetch first')) {
        console.log('远程有新的提交，尝试先拉取再推送...');
        if (await this.pull()) {
          return await this.push();
        }
      }

      return false;
    }
  }

  /**
   * 同步（拉取然后推送）
   */
  public async sync(): Promise<boolean> {
    if (!this.initialized) {
      return false;
    }

    const pullSuccess = await this.pull();
    if (pullSuccess) {
      return await this.push();
    }
    return false;
  }

  /**
   * 处理冲突
   */
  private async resolveConflicts(): Promise<boolean> {
    console.log('检测到合并冲突，请选择如何解决:');
    console.log('1. 使用本地版本');
    console.log('2. 使用远端版本');
    console.log('3. 取消同步');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<boolean>((resolve) => {
      rl.question('请输入选项 (1-3): ', async (answer) => {
        rl.close();

        try {
          switch (answer.trim()) {
            case '1':
              // 使用本地版本
              execSync('git checkout --ours .', { cwd: this.keyraDir, env: this.gitEnv() });
              execSync('git add .', { cwd: this.keyraDir, env: this.gitEnv() });
              execSync('git commit -m "Resolved conflicts using local version"', {
                cwd: this.keyraDir,
                env: this.gitEnv(),
              });
              console.log('已使用本地版本解决冲突');
              resolve(true);
              break;

            case '2':
              // 使用远端版本
              execSync('git checkout --theirs .', { cwd: this.keyraDir, env: this.gitEnv() });
              execSync('git add .', { cwd: this.keyraDir, env: this.gitEnv() });
              execSync('git commit -m "Resolved conflicts using remote version"', {
                cwd: this.keyraDir,
                env: this.gitEnv(),
              });
              console.log('已使用远端版本解决冲突');
              resolve(true);
              break;

            case '3':
              // 取消同步，回到合并前状态
              execSync('git merge --abort', { cwd: this.keyraDir, env: this.gitEnv() });
              console.log('已取消同步');
              resolve(false);
              break;

            default:
              console.log('无效选项，已取消同步');
              execSync('git merge --abort', { cwd: this.keyraDir, env: this.gitEnv() });
              resolve(false);
          }
        } catch (error: any) {
          console.error(`解决冲突失败: ${error?.message || '未知错误'}`);
          resolve(false);
        }
      });
    });
  }

  private gitEnv(): NodeJS.ProcessEnv {
    if (this.config?.sshKeyPath) {
      return {
        ...process.env,
        GIT_SSH_COMMAND: `ssh -i "${this.config.sshKeyPath}" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new`,
      };
    }
    return process.env;
  }
}

(async () => {
  // 测试代码
  // 创建GitManager实例
  var manager = new GitManager();
  console.log('manager');

  await manager.checkInitStatus();
  console.log('checkInitStatus');
  if (manager.isInitialized()) {
    console.log('Initialized');

    var result = await manager.sync();
    console.log(result);
  }
})();
