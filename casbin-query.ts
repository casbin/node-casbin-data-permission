import { WhereOptions, Op } from 'sequelize';

export enum CombineType {
    OR = 'OR',
    AND = 'AND',
}

export function conditionsToSequelizeQuery(conditions: string[], combineType: CombineType): WhereOptions {
    const where: WhereOptions = {};

    if (combineType === CombineType.OR) {
        (where as any)[Op.or] = conditions.map((condition) => ({ [Op['literal']]: condition }));
    } else if (combineType === CombineType.AND) {
        (where as any)[Op.and] = conditions.map((condition) => ({ [Op['literal']]: condition }));
    }

    return where;
}
