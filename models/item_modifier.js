'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item_modifier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item_modifier.init({
    option_item_uid: DataTypes.STRING,
    modifier_group_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    unique_name: DataTypes.STRING,
    option: DataTypes.STRING,
	price:DataTypes.STRING,
	amount:DataTypes.STRING,
	enabled:{type:DataTypes.ENUM, values:['0','1']},
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}	
  }, {
    sequelize,
    modelName: 'item_modifier',
  });
  return item_modifier;
};
