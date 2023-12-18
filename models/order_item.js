'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order_item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  order_item.init({
    order_item_uid: DataTypes.STRING,
    order_id: DataTypes.INTEGER,
    customer_id: DataTypes.INTEGER,
    item_id: DataTypes.INTEGER,
    varient_id: DataTypes.INTEGER,
    modifier_group:DataTypes.TEXT,
    extra_group:DataTypes.TEXT,
    quantity: DataTypes.INTEGER,
    subtotal: DataTypes.STRING,
    total: DataTypes.STRING,
    status: DataTypes.INTEGER,
    is_assembled:{type:DataTypes.ENUM, values:['0','1']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'order_item',
  });
  return order_item;
};
