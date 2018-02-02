import { Producer } from './Producer';
/**
 * Workflow relation
 */
export declare class Relation {
    private _from;
    private _to;
    private _code;
    /**
     * Get relation's parent producer
     */
    readonly from: Producer;
    /**
     * Get relation's child producer
     */
    readonly to: Producer;
    /**
     * Get relation's condition
     */
    readonly code: string;
    constructor(from: Producer, to: Producer, code?: string);
    /**
     * Test the condition
     * @param input Data using in this test
     */
    judge<T = any>(input: T): boolean;
}
