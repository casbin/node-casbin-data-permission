import { newEnforcer } from 'casbin';

async function main() {
  // 初始化一个 Enforcer，加载权限策略文件和权限模型文件
  const enforcer = await newEnforcer('path/to/model.conf', 'path/to/policy.csv');

  // 示例用户和资源
  const user = 'alice';
  const resource = 'data1';
  const action = 'read';

  // 对给定的用户、资源和操作进行鉴权
  const authorized = await enforcer.enforce(user, resource, action);

  if (authorized) {
    console.log(`${user} is allowed to ${action} ${resource}`);
  } else {
    console.log(`${user} is not allowed to ${action} ${resource}`);
  }
}

main().catch((error) => {
  console.error('Error:', error);
});
