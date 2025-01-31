import {TObjectProto} from "../_.spec";
import {IDeserializerOutput} from "../serde";

// todo: read the Constructor parameters in order to throw early if a field is missing
export function dataStructDeserializer(Constructor: TObjectProto, data: unknown): IDeserializerOutput {
    if (typeof data != 'object') {
        throw new Error(`Cannot default-deserialize ${Constructor.name}, because the data is of type ${typeof data}!`);
    }

    const obj: { [key: string]: any } = new Constructor();

    for (const kv of Object.entries(data as Object)) {
        obj[kv[0]] = kv[1];
    }

    return {
        containsRefs: false,
        data: obj,
    };
}

export function dataStructSerializer(component: unknown): unknown {
    return component;
}
