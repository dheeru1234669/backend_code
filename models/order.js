'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  order.init({
    order_uid: DataTypes.STRING,
    customer_id: DataTypes.INTEGER,
    subtotal: DataTypes.STRING,
    total: DataTypes.STRING,
    payment_mode: DataTypes.STRING,
    status: DataTypes.INTEGER,
    table_id: DataTypes.INTEGER,
    waiter_id: DataTypes.INTEGER,
    comment: DataTypes.STRING,
    created_by:{type:DataTypes.ENUM, values:['waiter','customer']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'order',
  });
  return order;
};
