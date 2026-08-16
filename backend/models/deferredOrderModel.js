import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const deferredOrderModel = sequelize.define('deferred_order', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false
    },
    items: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('items');
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
                    this.setDataValue('items', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('items', value);
                }
            } else {
                this.setDataValue('items', value);
            }
        }
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    address: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('address');
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
                    this.setDataValue('address', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('address', value);
                }
            } else {
                this.setDataValue('address', value);
            }
        }
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'cod'
    },
    triggerCondition: {
        type: DataTypes.STRING, // 'timer' | 'midnight_flash_sale' | 'price_drop' | 'restock'
        allowNull: false,
        defaultValue: 'timer'
    },
    triggerValue: {
        type: DataTypes.STRING, // Target price or custom payload
        allowNull: true
    },
    scheduledExecutionTime: {
        type: DataTypes.BIGINT, // Timestamp when timer expires or scheduled time
        allowNull: false
    },
    delayHours: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 12
    },
    status: {
        type: DataTypes.STRING, // 'scheduled' | 'executed' | 'cancelled'
        allowNull: false,
        defaultValue: 'scheduled'
    },
    notes: {
        type: DataTypes.STRING,
        allowNull: true
    },
    date: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: false
});

// Helper methods
deferredOrderModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.deferred_order.findAll(query);
    }
    return sequelize.models.deferred_order.findAll({ where: query });
};

deferredOrderModel.findById = async function(id) {
    return sequelize.models.deferred_order.findByPk(id);
};

deferredOrderModel.findByIdAndUpdate = async function(id, update) {
    await sequelize.models.deferred_order.update(update, { where: { _id: id } });
    return sequelize.models.deferred_order.findByPk(id);
};

deferredOrderModel.findByIdAndDelete = async function(id) {
    const record = await sequelize.models.deferred_order.findByPk(id);
    await sequelize.models.deferred_order.destroy({ where: { _id: id } });
    return record;
};

export default deferredOrderModel;
