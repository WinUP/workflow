import { Producer } from './Producer';

/**
 * Workflow relation
 */
export class Relation {
    private _from: Producer;
    private _to: Producer;
    private _inject?: string;
    private _code: string | ((input: any) => boolean);

    /**
     * Get relation's parent producer
     */
    public get from(): Producer {
        return this._from;
    }

    /**
     * Get relation's child producer
     */
    public get to(): Producer {
        return this._to;
    }

    /**
     * Get relation's condition
     */
    public get code(): string | ((input: any) => boolean) {
        return this._code;
    }

    /**
     * Get relation's inject parameter name
     * @description Inject parameter means data transfered by this relation will be inject to producer as a
     * temporaty "initialize" parameter only for this round of produce.
     */
    public get inject(): string | undefined {
        return this._inject;
    }

    public constructor(from: Producer, to: Producer, inject?: string, code: string | ((input: any) => boolean) = () => true) {
        this._from = from;
        this._to = to;
        this._inject = inject;
        this._code = code;
    }

    /**
     * Test the condition
     * @param input Data using in this test
     */
    public judge<T = any>(input: T): boolean {
        try {
            if (typeof this._code === 'string') {
                return eval(`(function(input){${this._code}})(input)`) ? true : false;
            } else {
                return this._code(input) ? true : false;
            }
        } catch (error) {
            throw EvalError(`Cannot run code under relation ${this._from.id} -> ${this._to.id}: ${error}`);
        }
    }
}
