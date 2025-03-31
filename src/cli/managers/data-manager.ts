import { KeyraData } from "../../lib/keyra-data.js";
import * as path from 'path';
import * as os from 'os';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';

/**
 * 数据管理器类 - 负责保存和加载密码数据
 */
export class DataManager {
  private dataItems: Map<string, KeyraData>;
  private defaultDataFilePath: string;

  constructor() {
    this.dataItems = new Map<string, KeyraData>();
    this.defaultDataFilePath = path.join(os.homedir(), '.keyra', 'data.json');
    
    // 在构造函数中尝试加载已保存的数据
    this.loadDataFromFile();
  }

  /**
   * 生成复合键
   * @param data 数据对象
   * @returns 复合键字符串
   */
  private generateCompositeKey(data: KeyraData): string {
    return `${data.serviceName}:${data.version || 1}`;
  }

  /**
   * 添加或更新数据
   * @param data 要添加或更新的数据
   */
  public addData(data: KeyraData): void {
    const key = this.generateCompositeKey(data);
    this.dataItems.set(key, data);
    // 数据更新后保存
    this.saveDataToFile();
  }

  /**
   * 获取数据
   * @param serviceName 服务名称
   * @returns 找到的最新版本数据，如果不存在则返回null
   */
  public getData(serviceName: string): KeyraData | null {
    // 查找所有匹配服务名的数据项
    const matchingItems: KeyraData[] = [];
    
    for (const [key, data] of this.dataItems.entries()) {
      if (key.startsWith(`${serviceName}:`)) {
        matchingItems.push(data);
      }
    }
    
    if (matchingItems.length === 0) {
      return null;
    }
    
    // 按版本号排序，获取最新版本
    return matchingItems.sort((a: KeyraData, b: KeyraData) => {
      const versionA = a.version || 1;
      const versionB = b.version || 1;
      return versionB - versionA;
    })[0];
  }

  /**
   * 获取服务的所有历史版本数据
   * @param serviceName 服务名称
   * @returns 该服务的所有历史版本数据数组，按版本号降序排列
   */
  public getServiceHistory(serviceName: string): KeyraData[] {
    const matchingItems: KeyraData[] = [];
    
    // 查找所有匹配服务名的数据项
    for (const [key, data] of this.dataItems.entries()) {
      if (key.startsWith(`${serviceName}:`)) {
        matchingItems.push(data);
      }
    }
    
    // 按版本号降序排列，从高到低
    return matchingItems.sort((a: KeyraData, b: KeyraData) => {
      const versionA = a.version || 1;
      const versionB = b.version || 1;
      return versionB - versionA;
    });
  }

  /**
   * 删除数据
   * @param serviceName 要删除的服务名称
   * @returns 是否成功删除
   */
  public deleteData(serviceName: string): boolean {
    const keysToDelete: string[] = [];
    
    // 查找所有匹配的键
    for (const key of this.dataItems.keys()) {
      if (key.startsWith(`${serviceName}:`)) {
        keysToDelete.push(key);
      }
    }
    
    if (keysToDelete.length === 0) {
      return false;
    }
    
    // 删除所有匹配的数据项
    for (const key of keysToDelete) {
      this.dataItems.delete(key);
    }
    
    // 数据删除后保存
    this.saveDataToFile();
    
    return true;
  }

  /**
   * 获取所有数据
   * @returns 所有数据的数组，每个服务只返回最新版本
   */
  public getAllData(): KeyraData[] {
    const serviceMap = new Map<string, KeyraData>();
    
    // 遍历所有数据，保留每个服务的最新版本
    for (const data of this.dataItems.values()) {
      const existing = serviceMap.get(data.serviceName);
      
      if (!existing) {
        serviceMap.set(data.serviceName, data);
        continue;
      }
      
      const existingVersion = existing.version || 1;
      const currentVersion = data.version || 1;
      
      if (currentVersion > existingVersion) {
        serviceMap.set(data.serviceName, data);
      }
    }
    
    return Array.from(serviceMap.values());
  }

  /**
   * 检查服务名称是否已存在
   * @param serviceName 服务名称
   * @returns 是否存在该服务
   */
  public hasService(serviceName: string): boolean {
    // 遍历所有数据项，检查是否有匹配的服务名
    for (const key of this.dataItems.keys()) {
      if (key.startsWith(`${serviceName}:`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 同步加载数据文件
   */
  public loadDataFromFile(): void {
    try {
      // 检查文件是否存在
      if (!existsSync(this.defaultDataFilePath)) {
        return; // 文件不存在时保持空数据
      }
      
      // 读取文件内容
      const data = readFileSync(this.defaultDataFilePath, 'utf-8');
      const dataObject: Record<string, string> = JSON.parse(data);
      
      // 添加数据
      for (const serviceName in dataObject) {
        try {
          const dataItem: KeyraData = KeyraData.deserialize(dataObject[serviceName]);
          this.dataItems.set(serviceName, dataItem);
        } catch (e: any) {
          console.error(`解析数据 "${serviceName}" 失败: ${e?.message || '未知错误'}`);
        }
      }
    } catch (error: any) {
      console.error(`初始化加载数据失败: ${error?.message || '未知错误'}`);
    }
  }

  /**
   * 同步保存数据文件
   */
  public saveDataToFile(): void {
    try {
      const dirPath = path.dirname(this.defaultDataFilePath);
      
      // 确保目录存在
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      
      // 创建保存对象，key为serviceName，value为数据序列化后的字符串
      const dataObject: Record<string, string> = {};
      this.dataItems.forEach((dataItem) => {
        dataObject[this.generateCompositeKey(dataItem)] = dataItem.serialize();
      });
      
      // 保存为JSON文件
      writeFileSync(this.defaultDataFilePath, JSON.stringify(dataObject, null, 2), 'utf-8');
    } catch (error: any) {
      console.error(`自动保存数据失败: ${error?.message || '未知错误'}`);
      // 自动保存失败时仅记录错误，不中断程序
    }
  }
}
