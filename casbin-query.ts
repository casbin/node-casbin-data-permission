import { WhereOptions, Op } from 'sequelize';

export enum CombineType {
    OR = 'OR',
    AND = 'AND',
}

const operatorMapping: Record<string, keyof typeof Op> = {
    '=': 'eq',
    '<': 'lt',
    '>': 'gt',
    '<=': 'lte',
    '>=': 'gte',
    '<>': 'ne',
};

export function parseCondition(condition: string): WhereOptions {
    const regex = /^(\w+)\s*(=|<|>|<=|>=|<>)\s*([\w\.\d]+)$/;
    const match = condition.match(regex);

    if (!match) {
        throw new Error(`Invalid condition: ${condition}`);
    }

    const [, column, operator, value] = match;
    const parsedValue = !isNaN(parseFloat(value)) ? parseFloat(value) : value;

    return {
        [column]: {
            [Op[operatorMapping[operator]]]: parsedValue,
        },
    };
}

export function conditionsToSequelizeQuery(conditions: string[], combineType: CombineType): WhereOptions {
    const where: WhereOptions = {};

    if (combineType === CombineType.OR) {
        (where as any)[Op.or] = conditions.map(parseCondition);
    } else if (combineType === CombineType.AND) {
        (where as any)[Op.and] = conditions.map(parseCondition);
    }

    return where;
}
