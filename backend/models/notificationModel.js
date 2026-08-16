import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const notificationModel = sequelize.define('notification', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING, // 'stock_alert' | 'sleep_and_shop' | 'price_drop' | 'general'
        defaultValue: 'general'
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    data: {
        type: DataTypes.JSON,
        defaultValue: {},
        get() {
            const rawValue = this.getDataValue('data');
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch (e) {
                    return rawValue;
                }
            }
            return rawValue;
        },
        set(value) {
            if (typeof value === 'string') {
                try {
                    this.setDataValue('data', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('data', value);
                }
            } else {
                this.setDataValue('data', value);
            }
        }
    },
    date: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: false
});

notificationModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.notification.findAll(query);
    }
    return sequelize.models.notification.findAll({ where: query });
};

notificationModel.findById = async function(id) {
    return sequelize.models.notification.findByPk(id);
};

notificationModel.findByIdAndUpdate = async function(id, update) {
    await sequelize.models.notification.update(update, { where: { _id: id } });
    return sequelize.models.notification.findByPk(id);
};

export default notificationModel;
