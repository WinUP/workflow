/**
 * Error happend when generate workflow from definitions
 */
export class GeneratorError extends Error {
    public constructor(message?: string) {
        super(message);
        this.name = 'Generator';
    }
}
