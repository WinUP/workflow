import { Producer } from './Producer';
/**
 * Workflow relation
 */
export declare class Relation {
    private _from;
    private _to;
    private _inject?;
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
    readonly code: string | ((input: any) => boolean);
    /**
     * Get relation's inject parameter name
     * @description Inject parameter means data transfered by this relation will be inject to producer as a
     * temporaty "initialize" parameter only for this round of produce.
     */
    readonly inject: string | undefined;
    constructor(from: Producer, to: Producer, inject?: string, code?: string | ((input: any) => boolean));
    /**
     * Test the condition
     * @param input Data using in this test
     */
    judge<T = any>(input: T): boolean;
}
