import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const productModel = sequelize.define('product', {
    _id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    image: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('image');
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
                    this.setDataValue('image', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('image', value);
                }
            } else {
                this.setDataValue('image', value);
            }
        }
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subCategory: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sizes: {
        type: DataTypes.JSON,
        allowNull: false,
        get() {
            const rawValue = this.getDataValue('sizes');
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
                    this.setDataValue('sizes', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('sizes', value);
                }
            } else {
                this.setDataValue('sizes', value);
            }
        }
    },
    sizeChart: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null,
        get() {
            const rawValue = this.getDataValue('sizeChart');
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
                    this.setDataValue('sizeChart', JSON.parse(value));
                } catch (e) {
                    this.setDataValue('sizeChart', value);
                }
            } else {
                this.setDataValue('sizeChart', value);
            }
        }
    },
    bestseller: {
        type: DataTypes.BOOLEAN,
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
productModel.find = async function(query = {}) {
    if (query && (query.where || query.attributes)) {
        return sequelize.models.product.findAll(query);
    }
    return sequelize.models.product.findAll({ where: query });
};

productModel.findById = async function(id) {
    return sequelize.models.product.findByPk(id);
};

productModel.findByIdAndDelete = async function(id) {
    const record = await sequelize.models.product.findByPk(id);
    await sequelize.models.product.destroy({ where: { _id: id } });
    return record;
};

export default productModel;