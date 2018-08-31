/**
 * Workflow runnign options
 */
export interface IWorkflowOptions {
    /**
     * Should consider whole input as one element
     */
    singleInput?: boolean;
    /**
     * Should only return the last producer's result
     */
    returnLast?: boolean;
}
