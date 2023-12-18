'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item_price_time_exceptions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item_price_time_exceptions.init({
    item_id: DataTypes.INTEGER,
    varient_id: DataTypes.INTEGER,
	varient_hash: DataTypes.STRING,
    day: DataTypes.STRING,
    price: DataTypes.STRING,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}	
  }, {
    sequelize,
    modelName: 'item_price_time_exceptions',
  });
  return item_price_time_exceptions;
};
