import {Enforcer, newEnforcer} from 'casbin';
import { getAllowedObjectConditions, ErrObjCondition, ErrEmptyCondition } from "./casbin-data";

describe('Casbin Authorization', () => {
    it('should authorize data access', async () => {
        const enforcer = await newEnforcer('data/rbac_model.conf', 'data/rbac_policy.csv');

        const subject = 'alice';
        const object = 'data1';
        const action = 'read';

        const isAllowed = await enforcer.enforce(subject, object, action);
        expect(isAllowed).toBe(true);
    });
});

describe('Casbin Batch Authorization', () => {
    it('should authorize data access for multiple requests', async () => {
        const enforcer = await newEnforcer('data/rbac_model.conf', 'data/rbac_policy.csv');

        const requests = [
            ['alice', 'data1', 'read'],
            ['alice', 'data2', 'write'],
            ['bob', 'data1', 'read'],
            ['bob', 'data2', 'write']
        ];

        const results = await enforcer.batchEnforce(requests);

        // Adjust the expected results according to your policy.
        const expectedResults = [true, true, false, true];

        expect(results).toEqual(expectedResults);
    });
});

describe('Casbin Get Implicit Permissions for User', () => {
    it('should retrieve implicit permissions for a user', async () => {
        const enforcer = await newEnforcer('data/rbac_model.conf', 'data/rbac_policy.csv');

        const user = 'alice';

        const permissions = await enforcer.getImplicitPermissionsForUser(user);

        // Adjust the expected permissions according to your policy.
        const expectedPermissions = [
            ['alice', 'data1', 'read'],
            ['alice', 'data2', 'write']
        ];

        expect(permissions).toEqual(expectedPermissions);
    });
});

async function testGetAllowedObjectConditions(
    enforcer: Enforcer,
    user: string,
    action: string,
    prefix: string,
    expectedRes: string[],
    expectedErr: Error | null
): Promise<void> {
    try {
        const res = await getAllowedObjectConditions(enforcer, user, action, prefix);
        if (expectedErr) {
            throw new Error(`Expected error: ${expectedErr.message}, but got no error.`);
        }

        expect(res).toEqual(expectedRes);
    } catch (err) {
        if (!expectedErr) {
            throw new Error(`Expected no error, but got error: ${err.message}`);
        }
        expect(err.message).toEqual(expectedErr.message);
    }
}

describe('GetAllowedObjectConditions', () => {
    let enforcer: Enforcer;

    beforeEach(async () => {
        enforcer = await newEnforcer('data/object_conditions_model.conf', 'data/object_conditions_policy.csv');
    });

    test('alice read r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'alice', 'read', 'r.obj.', ['price < 25', 'category_id = 2'], null);
    });

    test('admin read r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'admin', 'read', 'r.obj.', ['category_id = 2'], null);
    });

    test('bob write r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'bob', 'write', 'r.obj.', ['author = bob'], null);
    });

    test('alice write r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'alice', 'write', 'r.obj.', [], new ErrEmptyCondition());
    });

    test('bob read r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'bob', 'read', 'r.obj.', [], new ErrEmptyCondition());
    });

    test('alice read r.obj. with invalid policy', async () => {
        const ok = await enforcer.addPolicy('alice', 'price > 50', 'read');
        if (ok) {
            await testGetAllowedObjectConditions(enforcer, 'alice', 'read', 'r.obj.', [], new ErrObjCondition());
        }
    });

    test('prefix test', async () => {
        await enforcer.clearPolicy();
        // await enforcer.deleteLink('alice', 'admin');
        const ok = await enforcer.addPolicies([
            ['alice', 'r.book.price < 25', 'read'],
            ['admin2', 'r.book.category_id = 2', 'read'],
            ['bob', 'r.book.author = bob', 'write'],
        ]);

        if (ok) {
            await testGetAllowedObjectConditions(enforcer, 'alice', 'read', 'r.book.', ['price < 25'], null);
            await testGetAllowedObjectConditions(enforcer, 'admin2', 'read', 'r.book.', ['category_id = 2'], null);
            await testGetAllowedObjectConditions(enforcer, 'bob', 'write', 'r.book.', ['author = bob'], null);
        }
    });
});
