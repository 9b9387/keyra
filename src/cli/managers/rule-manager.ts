import { KeyraRule } from "../..";
import { DEFAULT_RULE } from "../../keyra/keyra-rule";
import * as path from 'path';
import * as os from 'os';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';

/**
 * 规则管理器类 - 负责保存和加载密码生成规则
 */
export class RuleManager {
  private rules: Map<string, KeyraRule>;
  private defaultRuleFilePath: string;

  constructor() {
    this.rules = new Map<string, KeyraRule>();
    this.rules.set(DEFAULT_RULE.name, DEFAULT_RULE);
    this.defaultRuleFilePath = path.join(os.homedir(), '.keyra', 'rules.json');
    
    // 在构造函数中尝试加载已保存的规则
    this.loadRulesFromFile();
  }

  /**
   * 添加或更新规则
   * @param rule 要添加或更新的规则
   */
  public addRule(rule: KeyraRule): void {
    if (rule.name === DEFAULT_RULE.name) {
      throw new Error('Default rule cannot be overridden');
    }
    this.rules.set(rule.name, rule);
    // 规则更新后保存
    this.saveRulesToFile();
  }

  /**
   * 获取规则
   * @param name 规则名称
   * @returns 找到的规则，如果不存在则返回默认规则
   */
  public getRule(name: string): KeyraRule | null {
    return this.rules.get(name) || null;
  }

  /**
   * 删除规则
   * @param name 要删除的规则名称
   * @returns 是否成功删除
   */
  public deleteRule(name: string): boolean {
    if (name === DEFAULT_RULE.name) {
      return false; // 不允许删除默认规则
    }
    
    const result = this.rules.delete(name);
    
    // 规则删除后保存
    if (result) {
      this.saveRulesToFile();
    }
    
    return result;
  }

  /**
   * 获取所有规则
   * @returns 所有规则的数组
   */
  public getAllRules(): KeyraRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * 同步加载规则文件
   */
  public loadRulesFromFile(): void {
    try {
      // 检查文件是否存在
      if (!existsSync(this.defaultRuleFilePath)) {
        return; // 文件不存在时保持默认规则
      }
      
      // 读取文件内容
      const data = readFileSync(this.defaultRuleFilePath, 'utf-8');
      const rulesObject: Record<string, string> = JSON.parse(data);
      
      // 添加规则
      for (const ruleName in rulesObject) {
        if (ruleName !== DEFAULT_RULE.name) { // 避免覆盖默认规则
          try {
            const rule: KeyraRule = KeyraRule.deserialize(rulesObject[ruleName]);
            this.rules.set(ruleName, rule);
          } catch (e: any) {
            console.error(`解析规则 "${ruleName}" 失败: ${e?.message || '未知错误'}`);
          }
        }
      }
    } catch (error: any) {
      console.error(`初始化加载规则失败: ${error?.message} || '未知错误'`);
      // 初始化时出错不抛出异常，继续使用默认规则
    }
  }

  /**
   * 同步保存规则文件
   */
  public saveRulesToFile(): void {
    try {
      const dirPath = path.dirname(this.defaultRuleFilePath);
      
      // 确保目录存在
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      
      // 创建保存对象，key为rule.name，value为规则序列化后的字符串
      const rulesObject: Record<string, string> = {};
      this.rules.forEach((rule) => {
        rulesObject[rule.name] = rule.serialize();
      });
      
      // 保存为JSON文件
      writeFileSync(this.defaultRuleFilePath, JSON.stringify(rulesObject, null, 2), 'utf-8');
    } catch (error: any) {
      console.error(`自动保存规则失败: ${error?.message} || '未知错误'`);
      // 自动保存失败时仅记录错误，不中断程序
    }
  }
}