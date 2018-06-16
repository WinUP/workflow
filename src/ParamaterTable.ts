import { cloneDeep } from 'lodash';

/**
 * A dictionary that stores parameters as key-value pair
 */
 export class ParameterTable {
    private storage: { [key: string]: any } = {};

    /**
     * Get value with key
     * @param key Parameter's key
     */
    public get<T = any>(key: string): T {
        return this.storage[key];
    }

    /**
     * Set value by key
     * @param key Parameter's key
     * @param value New value
     */
    public set<T>(key: string, value: T): T {
        this.storage[key] = value;
        return value;
    }

    /**
     * Remove value by key
     * @param key Parameter's key
     */
    public remove(key: string): void {
        if (this.storage[key] !== undefined) {
            delete this.storage[key];
        }
    }

    /**
     * Clear this paramater table
     */
    public clear(): void {
        this.storage = {};
    }

    /**
     * Replace this parameter table by a new key-value object
     * @param params Target object
     */
    public use(params: { [key: string]: any }): void {
        this.storage = params;
    }

    /**
     * Patch this parameter table by another key-value object
     * @param params Target object
     */
    public patch(params: { [key: string]: any }): void {
        Object.keys(params).forEach(key => {
            this.storage[key] = params[key];
        });
    }

    /**
     * Create a deep cloned instance of this parameter table
     */
    public clone(): ParameterTable {
        const result = new ParameterTable();
        result.use(cloneDeep(this.storage));
        return result;
    }
}
