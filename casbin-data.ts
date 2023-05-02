import {Enforcer} from "casbin";

class ErrObjCondition extends Error {
  constructor() {
    super("Need to meet the prefix required by the object condition");
    this.name = "ErrObjCondition";
  }
}

class ErrEmptyCondition extends Error {
  constructor() {
    super("GetAllowedObjectConditions have an empty condition");
    this.name = "ErrEmptyCondition";
  }
}

async function getAllowedObjectConditions(enforcer: Enforcer, user: string, action: string, prefix: string): Promise<string[]> {
  const permissions = await enforcer.getImplicitPermissionsForUser(user);

  const objectConditions: string[] = [];
  for (const policy of permissions) {
    // policy [sub, obj, act]
    if (policy[2] === action) {
      if (!policy[1].startsWith(prefix)) {
        throw new ErrObjCondition();
      }
      objectConditions.push(policy[1].substring(prefix.length));
    }
  }

  if (objectConditions.length === 0) {
    throw new ErrEmptyCondition();
  }

  return objectConditions;
}

export { getAllowedObjectConditions, ErrObjCondition, ErrEmptyCondition };
