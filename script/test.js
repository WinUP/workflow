var { WorkflowManager, Producer, Relation } = require('../dist');
var { CirculateSubWorkflowProducer } = require('../dist/Producers/CirculateSubWorkflow.producer');

class LogProducer extends Producer {
    introduce() { return ''; }

    parameterStructure() {
        return {
            log: {
                type: workflow.ParameterType.String,
                optional: true,
                default: '',
                description: 'Log content'
            }
        };
    }

    produce(input, params, context) {
        const content = params.get('log');
        console.log(`${this.id}: ${content}, ${JSON.stringify(context.environment)}`);
        return input;
    }
}

WorkflowManager.defaultActivator = () => LogProducer;

var mainManager = new WorkflowManager();
var entrance = new LogProducer('entrance');
var test1 = new LogProducer('test1');
var test2 = new LogProducer('test2');
var test3 = new LogProducer('test3');
entrance.initialize({ log: 'entrance' });
test1.initialize({ log: '1' });
test2.initialize({ log: '2' });
test3.initialize({ log: '3' });
Relation.create(entrance, test1);
Relation.create(entrance, test2);
Relation.create(entrance, test3);
mainManager.entrance = entrance;

var subWorkflow = new WorkflowManager();
subWorkflow.entrance = new LogProducer('sub1');

var subWorkflowProducer = new CirculateSubWorkflowProducer();
subWorkflowProducer.initialize({
    definition: subWorkflow,
    env: {},
    onResult: input => {
        return input.map(v => v.data[0].data[0]);
    },
    onLoop: (env, context, output) => {
        env.skip = env.skip || 0;
        env.skip++;
        return env.skip < 3;
    }
});

Relation.create(test3, subWorkflowProducer);

mainManager.runWithAutopack(0, { test: 1 })
    .then(async v => {
        console.log(v.data[v.data.length - 1].data)
    })
    .catch(async e => console.log(e));
