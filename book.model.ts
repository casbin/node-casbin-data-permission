import { DataTypes, Model } from 'sequelize';
import { sequelize } from './sequelize-setup';

class Book extends Model {
    public id!: number;
    public title!: string;
    public author!: string;
    public publisher!: string;
    public publishDate!: Date;
    public price!: number;
    public categoryId!: number;
}

Book.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        title: DataTypes.STRING,
        author: DataTypes.STRING,
        publisher: DataTypes.STRING,
        publishDate: DataTypes.DATE,
        price: DataTypes.FLOAT,
        categoryId: DataTypes.INTEGER,
    },
    {
        tableName: 'books',
        sequelize,
        underscored: true,
    }
);

export { Book };
