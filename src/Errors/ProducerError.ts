/**
 * Error happend in producer's logic
 */
export class ProducerError extends Error {
    public constructor(producerType: string, producerId: string, message?: string | Error) {
        if (message instanceof Error) {
            super(message.message);
            this.stack = `Exception in ${producerType}: ID {${producerId}} \n${message.stack}`;
        } else {
            super(message);
            this.stack = `Exceprion in ${producerType}: ID {${producerId}} \n${this.stack}`;
        }
    }
}
