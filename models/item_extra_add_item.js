'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item_extra_add_item extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item_extra_add_item.init({
    item_uid: DataTypes.STRING,
    extra_group_id: DataTypes.INTEGER,
	enabled:{type:DataTypes.ENUM, values:['0','1']},
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'item_extra_add_item',
  });
  return item_extra_add_item;
};
