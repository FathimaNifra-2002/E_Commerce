import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const orderModel = sequelize.define('order', {
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
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Order Placed'
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: false
    },
    payment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    date: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    timestamps: false
});

// Mongoose Emulation Helpers
orderModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.order.findAll(query);
    }
    return sequelize.models.order.findAll({ where: query });
};

orderModel.findById = async function(id) {
    return sequelize.models.order.findByPk(id);
};

orderModel.findByIdAndUpdate = async function(id, update) {
    await sequelize.models.order.update(update, { where: { _id: id } });
    return sequelize.models.order.findByPk(id);
};

orderModel.findByIdAndDelete = async function(id) {
    const record = await sequelize.models.order.findByPk(id);
    await sequelize.models.order.destroy({ where: { _id: id } });
    return record;
};

export default orderModel;