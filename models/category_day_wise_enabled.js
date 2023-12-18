'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class category_day_wise_enabled extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  category_day_wise_enabled.init({
    cat_id: DataTypes.INTEGER,
    day_name: DataTypes.STRING,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'category_day_wise_enabled',
  });
  return category_day_wise_enabled;
};
