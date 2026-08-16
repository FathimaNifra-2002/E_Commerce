import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const priceHistoryModel = sequelize.define('priceHistory', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    productId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    date: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'priceHistories'
});

// Mongoose Emulation Helpers
priceHistoryModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.priceHistory.findAll(query);
    }
    return sequelize.models.priceHistory.findAll({ where: query });
};

export default priceHistoryModel;
