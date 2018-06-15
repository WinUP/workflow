# Workflow manager

![status](https://img.shields.io/travis/WinUP/workflow.svg?style=flat-square)
[![npm](https://img.shields.io/npm/v/@ekifvk/workflow.svg?style=flat-square)](https://www.npmjs.com/package/@ekifvk/workflow)

Workflow manager is a suit of tools to provide workflow control in javascript. It has:

* Manager to manager workflow
* Producer (abstract class) to produce data
* Relation to descripe relationship between each producer

with features:

* Multiple input / output for all producers
* Asynchronized data stream
* Relations can use javascript code to allow full or part data transfer from one producer to another

![](https://raw.githubusercontent.com/WinUP/workflow/master/docs/sequence.png)

For example, in this case, run sequence should be 1 -> 2-1 -> 3 -> 2-2 -> 4 automatically.

### How to use

```bash
npm install @ekifvk/workflow
```

1. Create a WorkflowManager.

```typescript
const manager = new WorkflowManager();
```

2. Create some producers.

```typescript
const a = new SomeProducer();
const b = new SomeProducer2();
```

3. Add relations.

```typescript
// last param is the condition, use 'input' to access input data, like 'return input.a === "a"'.
Relation.create(a, b, 'return input.a === a');
Relation.create(a, b, input => input.a === a); // or use function
```

4. Register entrace.

```typescript
manager.entrance = a;
manager.output = b; // Optional. Set output will only return output's result for memory optimization.
```

5. Run workflow.

```typescript
if (manager.unreachableNodes.length > 0) { // Check if workflow's DAG has unreachable nodes.
    throw new TypeError(`Has unreachable node!`);
} else {
    manager.run(/* input data */).then(...).catch(...);
}
```

### Stop, pause and resume

Workflow cannot pause/stop current running producer, but it can pause/stop before process next producer.

```typescript
mamager.pause().then(() => {
    console.log('Paused!');
});

setTimeout(() => {
    manager.resume();
}, 3000);

manager.stop().then(() => {
    console.log('Stopped!');
});
```

### How to write producer

All producers must extend Producer, which is an abstract class, they can have these function implementations:

```typescript
public abstract introduce(): string;
public abstract parameterStructure(): ParameterDescriptor;
public abstract produce(input: any[], params: ParameterTable): any[] | Promise<any[]>;
protected checkParameters(params: { [key: string]: any }): { [key: string]: any };
```

The checkParameters function should check the parameter's type and change them if needed. The introduce function should return producer's description. The parameterStructure function should return a list of Parameter which defined initialize's parameter structure (still it has no use). The _produce function should produce the data and return new data.

One more thing, producers can access their parameter by using ```params```. Of course they can handle parameters by their own, but using ```params``` will have an automatic cache & replace if ```inject``` by relation(s) is active when running.

Producer should use ```params.get(/* name */)``` to get parameter in purpose to support parameter injection. Or it can use ```this.parameters.get(/* name */)``` to access parameters without injection.

```typescript
return input + params.get<number>('number1');
```

For example, a producer that returns { key, value } pairs of any object can be like this:

```typescript
export class KeyValuePairProducer extends Producer {
    public introduce(): string {
        return 'Read input object\'s key and value and return { key: key, value: value } array';
    }

    public parameterStructure(): ParameterDescriptor| null {
        return {}; // No parameter
    }

    public produce(input: any[], params: ParameterTable): any[] | Promise<any[]> {
        const result: any[] = [];
        input.forEach(data => { // Map the data
            const keys = Object.keys(data).forEach(key => {
                result.push({ key: key, value: data[key] }); 
            });
        });
        return result;
    }
}
```

### Pre-defined producers

#### Empty producer

Producer that does nothing.

#### Wrap producer

This producer can create a temporary producer using given code.

```typescript
const wrap = new WrapProducer();
wrap.initialize({
    handler: (input, params) => input // just like writing a producer
});
// or
wrap.initialize({
    handler: async (input, params) => input // Promise is also supported
});
```

#### Data pick producer / Structured data pick producer

Pick data from json object or array, see [JPQuery](https://www.npmjs.com/package/@ekifvk/jpquery)'s document for more information.

```typescript
const picker = new DataPickerProducer();
picker.initialize({
    query: '/times/success[-1 -> -2]'
})

const picker2 = new StructuredDataPickProducer():
picker2.initialize({
    query: {
        lastTime: '/times/success[-1]',
        rawTime: '/times',
        lastTwoTimes: [ '/times/success[-2]', '/times/success[-1]' ]
    }
});
```

#### Value convert producer

Use given structure to focus on input data\'s specific places, then using rules to convert the value. See this producer's parameterStructure() for more information.

```typescript
const converter = new ValueConvertProducer();
converter.initialize({
    rules: [
        default: true,
        value: i => i * 2
    ],
    structure: {
        data1: {
            data2: [ { data3: true } ]
        }
    }
});
```

### Static workflow definition

A JSON object can be created to define a workflow or part of workflow:

```json
{
    "producers": [], // Optional in each file
    "relations": [], // Optional in each file
    "entrance": "", // Optional in each file, must has one in all files. Entrance producer's ID.
    "output": "" // Optional. Output producer's ID of workflow.
}
```

Elements in producers should follow this structure:

```json
{
    "id": "String. ID of this producer",
    "type": "String. the type of this producer. Normally if producer class's name is <name>Producer, then <name> is the type of that producer.",
    "parameters": "ParameterDescriptor. This producer's parameters.",
    "description": "String. Optional. Description of this producer."
}
```

Elements in relations should follow this structure:

```json
{
    "from": "String. Parent producer's ID.",
    "to": "String. Child producer's ID.",
    "inject": "Inject parameter name.  Inject parameter means data transfered by this relation will be inject to producer as a temporaty \"initialize\" parameter only for this round of produce.",
    "condition": "Null or function/function's content in string. It takes one param and should return true/false. Condition to judge the data that pass through this relation (in JavaScript)."
}
```

Call WorkflowManager.fromDefinitions() and provide all definition objects to get a workflow. The first paramater should be a function, which has a string param as type to return an instance of Producer. Rest params will be combined to one, please notice that one and only one of them must has entrance property.


### Example

```javascript
var workflow = require('@ekifvk/workflow');

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

    checkParameters(params: { [key: string]: any }) {
        params.log = params.log || '';
        return params;
    }

    produce(input, activeParams) {
        const content = activeParams.get('log');
        console.log(content);
        return input;
    }
}

var entrance = new LogProducer('entrance');

var test1 = new LogProducer('test1');
var test2 = new LogProducer('test2');
var test3 = new LogProducer('test3');
var test4 = new LogProducer('test4');
var test5 = new LogProducer('test5');

entrance.initialize({ log: 'entrance' });
test1.initialize({ log: '1' });
test2.initialize({ log: '2' });
test3.initialize({ log: '3' });
test4.initialize({ log: '4' });

entrance.relation(new workflow.Relation(entrance, test1));
test1.relation(new workflow.Relation(test1, test2));
test2.relation(new workflow.Relation(test2, test3));
test3.relation(new workflow.Relation(test3, test4));

manager.entrance = entrance;
manager.output = test3;

// Check error
if (manager.unreachableNodes.length > 0) {
    throw new TypeError(`Has unreachable node!`);
}

// Run workflow
manager.run(0)
    .then(v => console.log(v))
    .catch(e => console.log('error: ' + e));

// Pause and resume
manager.pause().then(() => {
    setTimeout(() => {
        manager.resume();
    }, 3000);
})
```