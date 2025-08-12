import { KeyraData } from '../../lib/keyra-data.js';
import * as path from 'path';
import * as os from 'os';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'fs';

/**
 * DataManager - Responsible for saving and loading password data for services.
 * Each service can have multiple versions. Data is stored in ~/.keyra/data.json.
 */
export class DataManager {
  private dataItems: Map<string, KeyraData>;
  private defaultDataFilePath: string;

  constructor() {
    this.dataItems = new Map<string, KeyraData>();
    this.defaultDataFilePath = path.join(os.homedir(), '.keyra', 'data.json');
    // Load saved data on initialization
    this.loadDataFromFile();
  }

  /**
   * Generate a composite key for a data entry (serviceName:version)
   * @param data KeyraData object
   * @returns Composite key string
   */
  private generateCompositeKey(data: KeyraData): string {
    return `${data.serviceName}:${data.version || 1}`;
  }

  /**
   * Add or update a data entry for a service (by version)
   * @param data Data to add or update
   */
  public addData(data: KeyraData): void {
    const key = this.generateCompositeKey(data);
    this.dataItems.set(key, data);
    // Save after update
    this.saveDataToFile();
  }

  /**
   * Get the latest data for a service
   * @param serviceName Service name
   * @returns Latest version data, or null if not found
   */
  public getData(serviceName: string): KeyraData | null {
    const matchingItems: KeyraData[] = [];
    for (const [key, data] of this.dataItems.entries()) {
      if (key.startsWith(`${serviceName}:`)) {
        matchingItems.push(data);
      }
    }
    if (matchingItems.length === 0) {
      return null;
    }
    // Sort by version descending, return latest
    return matchingItems.sort((a: KeyraData, b: KeyraData) => {
      const versionA = a.version || 1;
      const versionB = b.version || 1;
      return versionB - versionA;
    })[0];
  }

  /**
   * Get all version history for a service (descending order)
   * @param serviceName Service name
   * @returns Array of all versions, newest first
   */
  public getServiceHistory(serviceName: string): KeyraData[] {
    const matchingItems: KeyraData[] = [];
    for (const [key, data] of this.dataItems.entries()) {
      if (key.startsWith(`${serviceName}:`)) {
        matchingItems.push(data);
      }
    }
    return matchingItems.sort((a: KeyraData, b: KeyraData) => {
      const versionA = a.version || 1;
      const versionB = b.version || 1;
      return versionB - versionA;
    });
  }

  /**
   * Delete all data for a service (all versions)
   * @param serviceName Service name to delete
   * @returns True if deleted, false if not found
   */
  public deleteData(serviceName: string): boolean {
    const keysToDelete: string[] = [];
    for (const key of this.dataItems.keys()) {
      if (key.startsWith(`${serviceName}:`)) {
        keysToDelete.push(key);
      }
    }
    if (keysToDelete.length === 0) {
      return false;
    }
    for (const key of keysToDelete) {
      this.dataItems.delete(key);
    }
    // Save after delete
    this.saveDataToFile();
    return true;
  }

  /**
   * Get all latest data for all services (one per service)
   * @returns Array of latest data for each service
   */
  public getAllData(): KeyraData[] {
    const serviceMap = new Map<string, KeyraData>();
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
   * Check if a service exists (any version)
   * @param serviceName Service name
   * @returns True if exists, false otherwise
   */
  public hasService(serviceName: string): boolean {
    for (const key of this.dataItems.keys()) {
      if (key.startsWith(`${serviceName}:`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Load data from file (synchronously)
   */
  public loadDataFromFile(): void {
    try {
      if (!existsSync(this.defaultDataFilePath)) {
        return; // No file, keep empty
      }
      const data = readFileSync(this.defaultDataFilePath, 'utf-8');
      const dataObject: Record<string, string> = JSON.parse(data);
      for (const serviceName in dataObject) {
        try {
          const dataItem: KeyraData = KeyraData.deserialize(dataObject[serviceName]);
          this.dataItems.set(serviceName, dataItem);
        } catch (e: any) {
          console.error(
            `Failed to parse data for "${serviceName}": ${e?.message || 'Unknown error'}`,
          );
        }
      }
    } catch (error: any) {
      console.error(`Failed to initialize data: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Save all data to file (synchronously)
   */
  public saveDataToFile(): void {
    try {
      const dirPath = path.dirname(this.defaultDataFilePath);
      if (!existsSync(dirPath)) {
        mkdirSync(dirPath, { recursive: true });
      }
      // Save as { compositeKey: serializedData }
      const dataObject: Record<string, string> = {};
      this.dataItems.forEach((dataItem) => {
        dataObject[this.generateCompositeKey(dataItem)] = dataItem.serialize();
      });
      writeFileSync(this.defaultDataFilePath, JSON.stringify(dataObject, null, 2), 'utf-8');
    } catch (error: any) {
      console.error(`Failed to auto-save data: ${error?.message || 'Unknown error'}`);
      // Only log error, do not throw
    }
  }
}
