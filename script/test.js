var { WorkflowManager, Producer, Relation } = require('../dist');
var { CirculateSubWorkflowProducer } = require('../dist/Producers/CirculateSubWorkflow.producer');
var { WrapProducer }  = require('../dist/Producers/Wrap.producer');

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
var test3 = new WrapProducer('test3');
var test4 = new LogProducer('test4');
entrance.initialize({ log: 'entrance' });
test1.initialize({ log: '1' });
test1.runningDelay = 2000;
test1.proceed = input => {
    console.log('proceed: ' + input);
    return input;
};
test2.initialize({ log: '2' });
test3.initialize({ handler: () => {
    throw new TypeError('terminated');
} });
test3.onError = error => {
    console.log(`detect error: ${error}`);
    return [];
};
Relation.create(entrance, test1);
Relation.create(entrance, test2);
Relation.create(test2, test3);
Relation.create(test1, test3);
Relation.create(test3, test4);
mainManager.entrance = entrance;
mainManager.output = test4;

mainManager.run(0, { test: 1 }, { singleInput: true, returnLast: false })
    .then(async v => {
        console.log(v.data)
    })
    .catch(async e => console.log(e));
