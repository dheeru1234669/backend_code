'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class order_fulfillment_wise_prepared_time extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  order_fulfillment_wise_prepared_time.init({
    order_id: DataTypes.INTEGER,
    fulfillment_by_id: DataTypes.INTEGER,
    order_created: DataTypes.DATE,
    before_confirm_time:DataTypes.TIME,
    confirmed_time:DataTypes.DATE,
    max_prepared_time:DataTypes.TIME,
    preparing_time:DataTypes.TIME,
    status: DataTypes.INTEGER,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'order_fulfillment_wise_prepared_time',
  });
  return order_fulfillment_wise_prepared_time;
};
