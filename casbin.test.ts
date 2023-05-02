import { newEnforcer } from 'casbin';

describe('Casbin Authorization', () => {
    it('should authorize data access', async () => {
        const enforcer = await newEnforcer('model.conf', 'policy.csv');

        const subject = 'alice';
        const object = 'data1';
        const action = 'read';

        const isAllowed = await enforcer.enforce(subject, object, action);
        expect(isAllowed).toBe(true);
    });
});

describe('Casbin Batch Authorization', () => {
    it('should authorize data access for multiple requests', async () => {
        const enforcer = await newEnforcer('model.conf', 'policy.csv');

        const requests = [
            ['alice', 'data1', 'read'],
            ['alice', 'data2', 'write'],
            ['bob', 'data1', 'read'],
            ['bob', 'data2', 'write']
        ];

        const results = await enforcer.batchEnforce(requests);

        // Adjust the expected results according to your policy.
        const expectedResults = [true, false, false, true];

        expect(results).toEqual(expectedResults);
    });
});
