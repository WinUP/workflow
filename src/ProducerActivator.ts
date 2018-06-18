import { Producer } from './Producer';

export type ProducerActivator = (type: string) => ((new (id?: string) => Producer) | undefined);
