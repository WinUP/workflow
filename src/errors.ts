/**
 * Error for unavailable resources and actions
 */
export class UnavailableError extends Error {
    public constructor(message?: string) {
        super(message);
        this.name = 'Unavailable';
    }
}

/**
 * Error for conflict resoruces and actions
 */
export class ConflictError extends Error {
    public constructor(message?: string) {
        super(message);
        this.name = 'Conflict';
    }
}

/**
 * Error happend when generate workflow from definitions
 */
export class GeneratorError extends Error {
    public constructor(message?: string) {
        super(message);
        this.name = 'Generator';
    }
}

/**
 * Error happend in producer's logic
 */
export class ProducerError extends Error {
    public constructor(producerType: string, producerId: string, message?: string | Error) {
        if (message instanceof Error) {
            super(message.message);
            this.stack = message.stack;
        } else {
            super(message);
        }
        this.name = `${producerType} {${producerId}}`;
    }
}
