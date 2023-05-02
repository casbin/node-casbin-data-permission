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
