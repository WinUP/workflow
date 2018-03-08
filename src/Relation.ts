import { Producer } from './Producer';

/**
 * Workflow relation
 */
export class Relation {
    private _from: Producer;
    private _to: Producer;
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

    public constructor(from: Producer, to: Producer, code: string = 'return true;') {
        this._from = from;
        this._to = to;
        this._code = code;
    }

    /**
     * Test the condition
     * @param input Data using in this test
     */
    public judge<T = any>(input: T): boolean {
        if (typeof this._code === 'string') {
            return eval(`(function(input){${this._code}})(input)`) ? true : false;
        } else {
            return this._code(input) ? true : false;
        }
    }
}
