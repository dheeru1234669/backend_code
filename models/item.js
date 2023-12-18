'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item.init({
    item_uid: DataTypes.STRING,
    code: DataTypes.STRING,
    cat_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    created_by: DataTypes.INTEGER,
    fulfillment_by: DataTypes.INTEGER,
    prepared_time: DataTypes.INTEGER,
	out_of_stock:{type:DataTypes.ENUM, values:['0','1']},
	enabled:{type:DataTypes.ENUM, values:['0','1']},
	is_visible:{type:DataTypes.ENUM, values:['0','1']},
	visibility:{type:DataTypes.ENUM, values:['0','1','2']},
	time_visibility:{type:DataTypes.ENUM, values:['0','1']},
    short_desc: DataTypes.TEXT,
    long_desc: DataTypes.TEXT,
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}	
  }, {
    sequelize,
    modelName: 'item',
  });
  return item;
};
