import { IProduceResult } from './Models';
import { Producer } from './Producer';

/**
 * Event arguments for running workflow
 */
export class WorkflowContext<TENV extends { [key: string]: any } = { [key: string]: any }> {
    /**}
     * Should stop workflow after this producer
     */
    public cancelled: boolean = false;
    /**
     * Current data pool
     */
    public dataPool: Readonly<IProduceResult<any>[]> = [];
    /**
     * Finished producers
     */
    public finished: Readonly<Producer[]> = [];
    /**
     * Skipped producers (producer that has no apposite input data or skipped by relation)
     */
    public skipped: Readonly<Producer[]> = [];
    /**
     * Environment parameters
     */
    public environment: TENV = {} as TENV;
}
