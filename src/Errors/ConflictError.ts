/**
 * Error for conflict resoruces and actions
 */
export class ConflictError extends Error {
    public constructor(message?: string) {
        super(message);
        this.name = 'Conflict';
    }
}
