/**
 * Relation definition
 */
export interface IRelation {
    /**
     * Parent producer
     */
    from: string;
    /**
     * Child producer
     */
    to: string;
    /**
     * Inject parameter name
     */
    inject?: string;
    /**
     * Condition
     */
    condition?: string | null | ((input: any) => boolean);
    /**
     * Allow empty (empty array) data transfers to relation's target, otherwise target will be disabled on this situation
     */
    allowEmptyInput?: boolean;
}
