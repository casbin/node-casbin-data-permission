import {Enforcer, newEnforcer} from 'casbin';
import { Book } from './book.model';
import { sequelize } from './sequelize-setup';
import { Op } from 'sequelize';
import { getAllowedObjectConditions } from './casbin-data';
import {conditionsToSequelizeQuery, CombineType, parseCondition} from './casbin-query';

describe('parseCondition', () => {
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

describe('GetAllowedRecordsForUser', () => {
    let enforcer: Enforcer;

    beforeAll(async () => {
        enforcer = await newEnforcer('data/object_conditions_model.conf', 'data/object_conditions_policy.csv');
    });

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        await Book.bulkCreate([
            { title: 'Book 1', author: 'Author 1', publisher: 'Publisher 1', publishDate: new Date(), price: 20, categoryId: 2 },
            { title: 'Book 2', author: 'Author 2', publisher: 'Publisher 2', publishDate: new Date(), price: 30, categoryId: 2 },
            { title: 'Book 3', author: 'Author 3', publisher: 'Publisher 3', publishDate: new Date(), price: 40, categoryId: 3 },
        ]);
    });

    test('alice read r.obj.', async () => {
        const user = 'alice';
        const action = 'read';
        const prefix = 'r.obj.';

        const conditions = await getAllowedObjectConditions(enforcer, user, action, prefix);
        console.log(conditions);

        console.log('CombineType.OR');
        const booksOr = await Book.findAll({ where: conditionsToSequelizeQuery(conditions, CombineType.OR) });
        console.log(booksOr.map((book) => book.toJSON()));

        console.log('CombineType.AND');
        const booksAnd = await Book.findAll({ where: conditionsToSequelizeQuery(conditions, CombineType.AND) });
        console.log(booksAnd.map((book) => book.toJSON()));
    });
});
