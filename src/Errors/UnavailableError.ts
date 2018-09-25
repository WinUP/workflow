/**
 * Error for unavailable resources and actions
 */
export class UnavailableError extends Error {
    public constructor(message?: string) {
        super(message);
        this.name = 'Unavailable';
    }
}
