'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item_visibility extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item_visibility.init({
    item_id: DataTypes.INTEGER,
    show_hide_item: {type:DataTypes.ENUM, values:['0','1','2']},
    day_id: DataTypes.INTEGER,
    start_time: DataTypes.STRING,
    end_time: DataTypes.STRING,
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
  	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}	
  }, {
    sequelize,
    modelName: 'item_visibility',
  });
  return item_visibility;
};
