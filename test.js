var workflow = require('./dist');

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

    _produce(input) {
        const content = this.parameters.get('log');
        console.log(this.id + ': ' + content);
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

entrance.relation(new workflow.Relation(entrance, test1));
entrance.relation(new workflow.Relation(entrance, test2));
entrance.relation(new workflow.Relation(entrance, test3));
entrance.relation(new workflow.Relation(entrance, test4));
test1.relation(new workflow.Relation(test1, test4, 'log'));
test2.relation(new workflow.Relation(test2, test5, 'log'));
test3.relation(new workflow.Relation(test3, test6, 'log'));
test4.relation(new workflow.Relation(test4, test5));
test5.relation(new workflow.Relation(test5, test6));

manager.entrance = entrance;
manager.output = test6
manager.run(0)
    .then(async v => console.log({ producer: v.data[0].producer, data: JSON.stringify(v.data[0].data) }))
    .catch(async e => console.log('c' + e));
