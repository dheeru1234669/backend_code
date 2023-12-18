'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class modifier_group extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  modifier_group.init({
    uid: DataTypes.STRING,
    name: DataTypes.STRING,
    unique_name: DataTypes.STRING,
	is_require:{type:DataTypes.ENUM, values:['0','1']},
    max_item_select: DataTypes.INTEGER,
    max_time_select: DataTypes.INTEGER,
    map_other_group:{type:DataTypes.ENUM, values:['0','1']},
	enabled:{type:DataTypes.ENUM, values:['0','1','2']},
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'modifier_group',
  });
  return modifier_group;
};
