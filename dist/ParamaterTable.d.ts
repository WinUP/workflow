export declare class ParameterTable {
    private storage;
    get<T>(key: string): T;
    set<T>(key: string, value: T): T;
    remove(key: string): void;
    clear(): void;
    use(params: {
        [key: string]: any;
    }): void;
    patch(params: {
        [key: string]: any;
    }): void;
}
