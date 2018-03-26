# Workflow manager

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

0. Install.

        npm install @ekifvk/workflow

1. Create a WorkflowManager.

        const manager = new WorkflowManager();

2. Create some producers.

        const a = new SomeProducer();
        const b = new SomeProducer2();

3. Add relations.

        // last param is the condition, use 'input' to access input data, like 'return input.a === "a"'.
        const relationAB = new Relation(a, b, 'return true');
        a.relation(relationAB); // or b.relation(relationAB)

4. Register entrace.

        manager.entrance = a;

5. Run workflow.

        manager.run(/* input data */).then(...);

### How to write producer

All producers must extend Producer, which is an abstract class, they can have these function implementations:

```typescript
public abstract introduce(): string;
public abstract parameterStructure(): ParameterDescriptor;
protected checkParameters(params: { [key: string]: any }): { [key: string]: any };
protected abstract _produce(input: any[]): any[] | Promise<any[]>;
```

The checkParameters function should check the parameter's type and change them if needed. The introduce function should return producer's description. The parameterStructure function should return a list of Parameter which defined initialize's parameter structure (still it has no use). The _produce function should produce the data and return new data.

One more thing, producers can access their parameter by using ```this.parameters```. Of course they can handle parameters by their own, but using ```this.parameters``` will have an automatic cache & replace if ```inject``` by relation(s) is active when running.

```typescript
return input + this.prameters.get<number>('number1');
```

Parameters stores to ```this.parameter``` automatically and changed automatically based on relations.

For example, a producer that returns { key, value } pairs of any object can be like this:

```typescript
export class KeyValuePairProducer extends Producer {
    public introduce(): string {
        return 'Read input object\'s key and value and return { key: key, value: value } array';
    }

    public parameterStructure(): ParameterDescriptor| null {
        return {};
    }

    protected _produce(input: any[]): any[] | Promise<any[]> {
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

#### Data picker / Structured data picker

Pick data from json object or array, see [JPQuery](https://www.npmjs.com/package/@ekifvk/jpquery)'s document for more information.

```typescript
const picker = new DataPickerProducer();
picker.initialize({
    query: '/times/success[-1 -> -2]'
})

const picker2 = new StructuredDataPickerProducer():
picker2.initialize({
    query: {
        lastTime: '/times/success[-1]',
        rawTime: '/times',
        lastTwoTimes: [ '/times/success[-2]', '/times/success[-1]' ]
    }
});
```

#### Value converter

Use given structure to focus on input data\'s specific places, then using rules to convert the value. See this producer's parameterStructure() for more information.

```typescript
const converter = new ValueConverterProducer();
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
    "entrance": "" // Optional in each file, must has one in all files. Entrance producer's ID.
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
