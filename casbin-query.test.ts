/* 上述测试用例主要包括两部分：解析条件（parseCondition）和获取用户允许的记录（GetAllowedRecordsForUser）。
在解析条件部分，我们针对不同的条件字符串进行测试，验证 parseCondition 函数是否能正确地解析这些字符串并
输出相应的 Sequelize 查询条件。在获取用户允许的记录部分，我们首先创建一个新的 Enforcer 实例，然后在每个
测试用例执行之前同步数据库并创建一些示例数据。接下来，我们测试 Alice 用户的读取权限，获取允许的对象条件，
并使用 CombineType.OR 和 CombineType.AND 对条件进行组合，最后查询符合条件的图书数据。
 */

import {Enforcer, newEnforcer} from 'casbin';
import { Book } from './book.model';
import { sequelize } from './sequelize-setup';
import { Op } from 'sequelize';
import { getAllowedObjectConditions } from './casbin-data';
import {conditionsToSequelizeQuery, CombineType, parseCondition} from './casbin-query';

// 解析条件测试用例
describe('parseCondition', () => {
    // 测试解析 "price < 25" 条件
    test('should parse "price < 25" condition', () => {
        const input = 'price < 25';
        const expectedOutput = {
            price: {
                [Op.lt]: 25,
            },
        };

        const result = parseCondition(input);
        expect(result).toEqual(expectedOutput);
    });

    // 测试解析 "category_id = 2" 条件
    test('should parse "category_id = 2" condition', () => {
        const input = 'category_id = 2';
        const expectedOutput = {
            category_id: {
                [Op.eq]: 2,
            },
        };

        const result = parseCondition(input);
        expect(result).toEqual(expectedOutput);
    });
});

// 获取用户允许的记录测试用例
describe('GetAllowedRecordsForUser', () => {
    let enforcer: Enforcer;

    // 在所有测试用例执行前创建新的 Enforcer 实例
    beforeAll(async () => {
        enforcer = await newEnforcer('data/object_conditions_model.conf', 'data/object_conditions_policy.csv');
    });

    // 在每个测试用例执行前重新同步数据库并创建示例数据
    beforeEach(async () => {
        await sequelize.sync({ force: true });
        await Book.bulkCreate([
            { title: 'Book 1', author: 'Author 1', publisher: 'Publisher 1', publishDate: new Date(), price: 20, categoryId: 2 },
            { title: 'Book 2', author: 'Author 2', publisher: 'Publisher 2', publishDate: new Date(), price: 30, categoryId: 2 },
            { title: 'Book 3', author: 'Author 3', publisher: 'Publisher 3', publishDate: new Date(), price: 40, categoryId: 3 },
        ]);
    });

    // 测试 Alice 用户的读取权限
    test('alice read r.obj.', async () => {
        const user = 'alice';
        const action = 'read';
        const prefix = 'r.obj.';

        // 获取允许的对象条件
        const conditions = await getAllowedObjectConditions(enforcer, user, action, prefix);
        console.log(conditions);

        // 使用 CombineType.OR 组合条件
        console.log('CombineType.OR');
        const booksOr = await Book.findAll({ where: conditionsToSequelizeQuery(conditions, CombineType.OR) });
        console.log(booksOr.map((book) => book.toJSON()));

        // 使用 CombineType.AND 组合条件
        console.log('CombineType.AND');
        const booksAnd = await Book.findAll({ where: conditionsToSequelizeQuery(conditions, CombineType.AND) });
        console.log(booksAnd.map((book) => book.toJSON()));
    });
});
