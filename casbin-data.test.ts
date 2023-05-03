/* 本测试用例文件涵盖了 Casbin 的各种功能，包括基本授权、批量授权、获取用户的隐式权限以及获取用户在特定操作
下所允许的对象条件。每个测试用例都创建了一个新的 Enforcer 对象，并使用预定义的模型和策略文件对其进行了初始化。
在每个测试用例中，我们分别检查了请求是否被允许、结果是否符合预期等。通过这些测试用例，可以确保 Casbin 库在实际
应用中能够按照预期工作。
 */

// 导入所需的依赖项
import {Enforcer, newEnforcer} from 'casbin';
import { getAllowedObjectConditions, ErrObjCondition, ErrEmptyCondition } from "./casbin-data";

// 测试 Casbin 的基本授权功能
describe('Casbin Authorization', () => {
    // 测试一个基本的授权请求
    it('should authorize data access', async () => {
        // 创建一个新的 Enforcer，并初始化模型和策略
        const enforcer = await newEnforcer('data/rbac_model.conf', 'data/rbac_policy.csv');

        // 定义测试用的 subject, object 和 action
        const subject = 'alice';
        const object = 'data1';
        const action = 'read';

        // 检查请求是否被允许
        const isAllowed = await enforcer.enforce(subject, object, action);
        expect(isAllowed).toBe(true);
    });
});

// 测试 Casbin 的批量授权功能
describe('Casbin Batch Authorization', () => {
    // 测试批量授权请求
    it('should authorize data access for multiple requests', async () => {
        // 创建一个新的 Enforcer，并初始化模型和策略
        const enforcer = await newEnforcer('data/rbac_model.conf', 'data/rbac_policy.csv');

        // 定义测试用的多个请求
        const requests = [
            ['alice', 'data1', 'read'],
            ['alice', 'data2', 'write'],
            ['bob', 'data1', 'read'],
            ['bob', 'data2', 'write']
        ];

        // 执行批量授权检查
        const results = await enforcer.batchEnforce(requests);

        // 根据策略定义预期的结果
        const expectedResults = [true, true, false, true];

        // 检查结果是否符合预期
        expect(results).toEqual(expectedResults);
    });
});

// 测试获取用户的隐式权限
describe('Casbin Get Implicit Permissions for User', () => {
    // 测试获取用户的隐式权限
    it('should retrieve implicit permissions for a user', async () => {
        // 创建一个新的 Enforcer，并初始化模型和策略
        const enforcer = await newEnforcer('data/rbac_model.conf', 'data/rbac_policy.csv');

        // 定义测试用的用户
        const user = 'alice';

        // 获取用户的隐式权限
        const permissions = await enforcer.getImplicitPermissionsForUser(user);

        // 根据策略定义预期的权限
        const expectedPermissions = [
            ['alice', 'data1', 'read'],
            ['alice', 'data2', 'write']
        ];

        // 检查结果是否符合预期
        expect(permissions).toEqual(expectedPermissions);
    });
});

// 定义一个辅助函数 testGetAllowedObjectConditions，用于测试获取用户在特定操作下所允许的对象条件。
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

// 编写测试用例 'GetAllowedObjectConditions'
describe('GetAllowedObjectConditions', () => {
    let enforcer: Enforcer;

    beforeEach(async () => {
        enforcer = await newEnforcer('data/object_conditions_model.conf', 'data/object_conditions_policy.csv');
    });

    // 测试 Alice 在执行 'read' 操作时的允许对象条件
    test('alice read r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'alice', 'read', 'r.obj.', ['price < 25', 'category_id = 2'], null);
    });

    // 测试 admin 在执行 'read' 操作时的允许对象条件
    test('admin read r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'admin', 'read', 'r.obj.', ['category_id = 2'], null);
    });

    // 测试 Bob 在执行 'write' 操作时的允许对象条件
    test('bob write r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'bob', 'write', 'r.obj.', ['author = bob'], null);
    });

    // 测试 Alice 在执行 'write' 操作时的允许对象条件
    test('alice write r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'alice', 'write', 'r.obj.', [], new ErrEmptyCondition());
    });

    // 测试 Bob 在执行 'read' 操作时的允许对象条件
    test('bob read r.obj.', async () => {
        await testGetAllowedObjectConditions(enforcer, 'bob', 'read', 'r.obj.', [], new ErrEmptyCondition());
    });

    // 测试 Alice 在执行 'read' 操作时的允许对象条件，但策略中存在无效的条件
    test('alice read r.obj. with invalid policy', async () => {
        const ok = await enforcer.addPolicy('alice', 'price > 50', 'read');
        if (ok) {
            await testGetAllowedObjectConditions(enforcer, 'alice', 'read', 'r.obj.', [], new ErrObjCondition());
        }
    });

    // 测试使用不同的用户来获取允许的对象条件
    test('prefix test', async () => {
        await enforcer.clearPolicy();
        const ok = await enforcer.addPolicies([
            ['alice', 'r.book.price < 25', 'read'],
            ['admin2', 'r.book.category_id = 2', 'read'],
            ['bob', 'r.book.author = bob', 'write'],
        ]);

        if (ok) {
            // 使用不同的用户来测试获取允许的对象条件
            await testGetAllowedObjectConditions(enforcer, 'alice', 'read', 'r.book.', ['price < 25'], null);
            await testGetAllowedObjectConditions(enforcer, 'admin2', 'read', 'r.book.', ['category_id = 2'], null);
            await testGetAllowedObjectConditions(enforcer, 'bob', 'write', 'r.book.', ['author = bob'], null);
        }
    });
});
