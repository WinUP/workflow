import { Producer } from './Producer';

/**
 * Describe directed relationship between two producers
 */
export class Relation {
    private _from: Producer;
    private _to: Producer;
    private _inject?: string;
    private _condition: string | ((input: any) => boolean);

    /**
     * Allow empty (empty array) data transfers to relation's target, otherwise target will be disabled on this situation
     */
    public allowEmptyInput: boolean = false;

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
    public get condition(): string | ((input: any) => boolean) {
        return this._condition;
    }

    /**
     * Get relation's inject parameter name
     * @description Inject parameter means data transfered by this relation will be inject to producer as a
     * temporaty parameter only for next round of produce of child producer.
     */
    public get inject(): string | undefined {
        return this._inject;
    }

    /**
     * Create a new relation
     * @param from Relation's parent producer
     * @param to Relation's child producer
     * @param inject Inject parameter name if have
     * @param code Condition to judge transfered data
     * @param allowEmptyInput Allow empty (empty array) data transfers to relation's target
     */
    public static create(from: Producer, to: Producer, inject?: string, code?: string | ((input: any) => boolean),
        allowEmptyInput?: boolean): Relation {
        const relation = new Relation(from, to, inject, code);
        relation.allowEmptyInput = allowEmptyInput || false;
        from.relation(relation);
        return relation;
    }

    private constructor(from: Producer, to: Producer, inject?: string, code: string | ((input: any) => boolean) = () => true) {
        this._from = from;
        this._to = to;
        this._inject = inject;
        this._condition = code;
    }

    /**
     * Test the data with condition
     * @param input Data using in this test
     */
    public judge<T = any>(input: T): boolean {
        try {
            if (typeof this._condition === 'string') {
                return eval(`(function(input){${this._condition}})(input)`) ? true : false;
            } else {
                return this._condition(input) ? true : false;
            }
        } catch (error) {
            throw EvalError(`Cannot run code under relation ${this._from.id} -> ${this._to.id}: ${error}`);
        }
    }
}
