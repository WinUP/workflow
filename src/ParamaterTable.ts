export class ParameterTable {
    private storage: { [key: string]: any } = [];

    public get<T>(key: string): T {
        return this.storage[key];
    }

    public set<T>(key: string, value: T): T {
        this.storage[key] = value;
        return value;
    }

    public remove(key: string): void {
        if (this.storage[key] !== undefined) {
            delete this.storage[key];
        }
    }

    public clear(): void {
        this.storage = {};
    }

    public use(params: { [key: string]: any }): void {
        this.storage = params;
    }

    public patch(params: { [key: string]: any }): void {
        Object.keys(params).forEach(key => {
            this.storage[key] = params[key];
        });
    }
}
