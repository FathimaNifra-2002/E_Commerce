import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const priceAlertModel = sequelize.define('priceAlert', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    productId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    targetPrice: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    date: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: false,
    tableName: 'priceAlerts'
});

// Mongoose Emulation Helpers
priceAlertModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.priceAlert.findAll(query);
    }
    return sequelize.models.priceAlert.findAll({ where: query });
};

const originalFindOne = priceAlertModel.findOne;
priceAlertModel.findOne = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return originalFindOne.call(this, query);
    }
    return originalFindOne.call(this, { where: query });
};

priceAlertModel.findByIdAndUpdate = async function(id, update) {
    await sequelize.models.priceAlert.update(update, { where: { _id: id } });
    return sequelize.models.priceAlert.findByPk(id);
};

priceAlertModel.findByIdAndDelete = async function(id) {
    const record = await sequelize.models.priceAlert.findByPk(id);
    await sequelize.models.priceAlert.destroy({ where: { _id: id } });
    return record;
};

export default priceAlertModel;
