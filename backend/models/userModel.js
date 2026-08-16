import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const userModel = sequelize.define('user', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    cartData: {
        type: DataTypes.JSON,
        defaultValue: {},
        get() {
            const rawValue = this.getDataValue('cartData');
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
                    this.setDataValue('cartData', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('cartData', value);
                }
            } else {
                this.setDataValue('cartData', value);
            }
        }
    },
    bodyMeasurements: {
        type: DataTypes.JSON,
        defaultValue: null,
        get() {
            const rawValue = this.getDataValue('bodyMeasurements');
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
                    this.setDataValue('bodyMeasurements', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('bodyMeasurements', value);
                }
            } else {
                this.setDataValue('bodyMeasurements', value);
            }
        }
    }
}, {
    timestamps: false
});

// Mongoose Emulation Helpers
const originalFindOne = userModel.findOne;
userModel.findOne = async function(query) {
    if (query && (query.where || query.attributes || query.include)) {
        return originalFindOne.call(this, query);
    }
    return originalFindOne.call(this, { where: query });
};

userModel.findById = async function(id) {
    return sequelize.models.user.findByPk(id);
};

userModel.findByIdAndUpdate = async function(id, update) {
    await sequelize.models.user.update(update, { where: { _id: id } });
    return sequelize.models.user.findByPk(id);
};

userModel.findByIdAndDelete = async function(id) {
    const record = await sequelize.models.user.findByPk(id);
    await sequelize.models.user.destroy({ where: { _id: id } });
    return record;
};

export default userModel;