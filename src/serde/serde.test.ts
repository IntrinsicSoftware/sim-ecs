import { expect } from "chai";
import { ISerDeOptions, SerDe, TSerializer } from "./serde";
import { Entity, IEntity } from "../entity";
import { SerialFormat } from "./serial-format";
import { clearRegistry } from "../ecs/ecs-entity";
import {
  dataStructDeserializer,
  dataStructSerializer,
} from "../world-builder/world-builder.util";
import { WorldBuilder } from "../world-builder/world-builder";
import { buildWorld } from "../ecs/ecs-world";
import { TSerializable } from "./serde.spec";
import { Reference } from "./referencing";
import { EReferenceType } from "./referencing.spec";

describe("Test SerDe", () => {
  const compare = (entity1: IEntity, entity2: IEntity | undefined) => {
    {
      // Make sure they indeed are of the correct type
      expect(entity1 instanceof Entity).eq(true);
      expect(entity2 instanceof Entity).eq(true);
    }

    {
      // Compare tags
      const entity1Tags = Array.from(entity1.getTags());
      const entity2Tags = Array.from(entity2!.getTags());

      expect(entity1Tags.length).eq(entity2Tags.length);
      expect(entity1Tags[0]).eq(entity2Tags[0]);
    }

    {
      // Make sure they have the same components and values
      expect(Object.entries(Array.from(entity1.getComponents())).toString()).eq(
        Object.entries(Array.from(entity2!.getComponents())).toString()
      );
    }
  };
  const doSerDe = (
    entity1: IEntity,
    resources: Record<string, Object> = {},
    serdeOptions?: ISerDeOptions<never>
  ) => {
    const serial = serde
      .serialize(
        {
          entities: [entity1].values(),
          resources,
        },
        serdeOptions ?? options
      )
      .toJSON();
    return serde.deserialize(
      SerialFormat.fromJSON(serial),
      serdeOptions ?? options
    );
  };
  const doSerDeFirstEntity = (entity1: IEntity) =>
    doSerDe(entity1).entities.next().value;
  const serde = new SerDe();
  const options = {
    useDefaultHandler: true,
    useRegisteredHandlers: false,
  };

  afterEach(() => {
    clearRegistry();
  });

  it("DEFAULT HANDLERS: serialize -> deserialize empty entity", () => {
    const entity1 = new Entity();
    compare(entity1, doSerDeFirstEntity(entity1));
  });

  it("DEFAULT HANDLERS: serialize -> deserialize Array component", () => {
    const entity1 = new Entity();

    entity1.addComponent([42, 17, 1337, 20.365]);

    {
      const entity2 = doSerDeFirstEntity(entity1);

      compare(entity1, entity2);
      expect(entity1.getComponent(Array)?.pop())
        .eq(entity2!.getComponent(Array)?.pop())
        .not.eq(undefined);
    }
  });

  it("DEFAULT HANDLERS: serialize -> deserialize empty Object component", () => {
    const entity1 = new Entity();

    entity1.addComponent({});

    compare(entity1, doSerDeFirstEntity(entity1));
  });

  it("DEFAULT HANDLERS: serialize -> deserialize non-empty Object component", () => {
    const entity1 = new Entity();

    entity1.addComponent({
      foo: 1,
      bar: "baz",
    });

    compare(entity1, doSerDeFirstEntity(entity1));
  });

  it("DEFAULT HANDLERS: serialize -> deserialize Date component", () => {
    const entity1 = new Entity();

    entity1.addComponent(new Date(0));

    {
      const entity2 = doSerDeFirstEntity(entity1);

      compare(entity1, entity2);
      expect(entity1.getComponent(Date)!.toString()).eq(
        entity2!.getComponent(Date)!.toString()
      );
    }
  });

  it("DEFAULT HANDLERS: serialize -> deserialize Entity references", () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    const entity3 = new Entity();
    // class Parent {
    //   constructor(public children: Entity[] = []) {}
    // }
    // const component = new Parent([entity2, entity3]);
    const component = { children: [entity2, entity3] };

    entity1.addComponent(component);

    {
      const entity1out = doSerDeFirstEntity(entity1);
      const entity2out = doSerDeFirstEntity(entity2);
      //   compare(entity1, entity2);

      //   expect(entity1.getComponents().next().value.entity1.id).eq(
      //     entity2.getComponents().next().value.entity1.id
      //   );
      //   expect(entity1.id).eq(entity2.id);
    }
  });

  it("DEFAULT HANDLER - Entity Hierarchy", async () => {
    const entity1 = new Entity();
    const entity2 = new Entity();
    const entity3 = new Entity();
    const entity4 = new Entity();
    class Parent {
      constructor(public children: Entity[] = []) {}
    }
    class ParentTwo {
      constructor(public children: Entity[] = []) {}
    }

    entity1.addComponent(new Parent([entity2]));
    entity1.addComponent(new ParentTwo([entity3, entity4]));

    const serializeObjectReplacer = function (
      key: string,
      value: Object
    ): string | Object {
      return value instanceof Entity
        ? new Reference(EReferenceType.Entity, value.id).toString()
        : value;
    };
    const parentSerde = {
      serializer: (component: unknown) => {
        return JSON.stringify(component, serializeObjectReplacer);
      },
      deserializer: (data: unknown) => {
        const dataObject = JSON.parse(data as string);
        return { containsRefs: true, data: new Parent(dataObject.children) };
      },
    };
    const parentTwoSerde = {
      serializer: (component: unknown) => {
        return JSON.stringify(component, serializeObjectReplacer);
      },
      deserializer: (data: unknown) => {
        const dataObject = JSON.parse(data as string);
        return {
          containsRefs: true,
          data: new ParentTwo(dataObject.children),
        };
      },
    };

    const world = buildWorld()
      .name("World1")
      .withComponent(Parent, { serDe: parentSerde })
      .withComponent(ParentTwo, { serDe: parentTwoSerde })
      .build();

    world.addEntity(entity1);
    world.addEntity(entity2);
    world.addEntity(entity3);
    world.addEntity(entity4);

    const outJSON = world.save().toJSON();

    const world2 = buildWorld()
      .name("World2")
      .withComponent(Parent, { serDe: parentSerde })
      .withComponent(ParentTwo, { serDe: parentTwoSerde })
      .build();

    world2.commands.load(SerialFormat.fromJSON(outJSON), {
      useDefaultHandler: true,
    });

    // Critical when deserializing from prefabs
    await world2.flushCommands();

    expect(world2.save().toJSON()).eq(world.save().toJSON());
    const firstEntity = world.getEntities().next().value;
    expect(firstEntity).exist;

    const aParent = firstEntity.getComponent(Parent);
    expect(aParent).exist;
    expect(aParent.children.length).eq(1);

    const aParentTwo = firstEntity.getComponent(ParentTwo);
    expect(aParentTwo).exist;
    expect(aParentTwo.children.length).eq(2);

    expect(aParent.children[0].id).eq(entity2.id);
    expect(aParentTwo.children[0].id).eq(entity3.id);
    expect(aParentTwo.children[1].id).eq(entity4.id);
  });

  it("DEFAULT HANDLERS: serialize -> deserialize Tag", () => {
    const entity1 = new Entity();

    entity1.addTag("test");

    compare(entity1, doSerDeFirstEntity(entity1));
  });

  it("DEFAULT HANDLERS: serialize -> deserialize Resources", () => {
    serde.registerTypeHandler(
      ResourceA,
      dataStructDeserializer.bind(undefined, ResourceA),
      dataStructSerializer
    );

    const out = doSerDe(
      new Entity(),
      {
        resA: new ResourceA(),
      },
      {
        useDefaultHandler: true,
        useRegisteredHandlers: true,
      }
    );

    const res2 = out.resources[ResourceA.name] as ResourceA | undefined;

    expect(res2).not.eq(undefined);
    expect(res2!.foo).eq(42);

    serde.unregisterTypeHandler(ResourceA);
  });
});

class ResourceA {
  foo = 42;
}
