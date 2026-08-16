import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const stockAlertModel = sequelize.define('stock_alert', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    productId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    productName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    productImage: {
        type: DataTypes.STRING,
        allowNull: true
    },
    size: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING, // 'pending' | 'notified'
        defaultValue: 'pending'
    },
    date: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: false
});

stockAlertModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.stock_alert.findAll(query);
    }
    return sequelize.models.stock_alert.findAll({ where: query });
};

stockAlertModel.findById = async function(id) {
    return sequelize.models.stock_alert.findByPk(id);
};

stockAlertModel.findByIdAndUpdate = async function(id, update) {
    await sequelize.models.stock_alert.update(update, { where: { _id: id } });
    return sequelize.models.stock_alert.findByPk(id);
};

stockAlertModel.findByIdAndDelete = async function(id) {
    const record = await sequelize.models.stock_alert.findByPk(id);
    await sequelize.models.stock_alert.destroy({ where: { _id: id } });
    return record;
};

export default stockAlertModel;
