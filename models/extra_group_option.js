'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class extra_group_option extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  extra_group_option.init({
    extras_group_id: DataTypes.INTEGER,
    item_id: DataTypes.INTEGER,
    varient_id: DataTypes.INTEGER,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'extra_group_option',
  });
  return extra_group_option;
};
