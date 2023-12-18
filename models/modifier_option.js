'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class modifier_option extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  modifier_option.init({
    modifier_group_id: DataTypes.INTEGER,
    item_id:DataTypes.INTEGER,
    varient_id:DataTypes.INTEGER,
    uid: DataTypes.STRING,
    option: DataTypes.STRING,
    price: DataTypes.DECIMAL(10, 2),
    amount: DataTypes.DECIMAL(10, 2),
    map_modifier_group_id:DataTypes.INTEGER,
    is_option_map_to_group:{type:DataTypes.ENUM, values:['0','1']},
	enabled:{type:DataTypes.ENUM, values:['0','1','2']},
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'modifier_option',
  });
  return modifier_option;
};
