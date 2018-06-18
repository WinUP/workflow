var workflow = require('../dist');

workflow.WorkflowManager.defaultActivator = type => LogProducer;

var manager = new workflow.WorkflowManager();

class LogProducer extends workflow.Producer {
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

    produce(input, params, args) {
        const content = params.get('log');
        console.log(args.environment);
        return input;
    }
}

var entrance = new LogProducer('entrance');

var test1 = new LogProducer('test1');
var test2 = new LogProducer('test2');
var test3 = new LogProducer('test3');
var test4 = new LogProducer('test4');
var test5 = new LogProducer('test5');
var test6 = new LogProducer('test6');

entrance.initialize({ log: 'entrance' });
test1.initialize({ log: '1' });
test2.initialize({ log: '2' });
test3.initialize({ log: '3' });
test4.initialize({ log: '4' });
test5.initialize({ log: '5' });
test6.initialize({ log: '6' });

workflow.Relation.create(entrance, test1);
workflow.Relation.create(entrance, test2);
workflow.Relation.create(entrance, test3);
workflow.Relation.create(entrance, test4);
workflow.Relation.create(test1, test4, 'log');
workflow.Relation.create(test2, test5, 'log');
workflow.Relation.create(test3, test6, 'log');
workflow.Relation.create(test4, test5);
workflow.Relation.create(test5, test6);

manager.entrance = entrance;
manager.output = test6
manager.runWithAutopack(0, { test: 1 })
    .then(async v => console.log({ producer: v.data, data: JSON.stringify(v.data[0].data) }))
    .catch(async e => console.log(e));
