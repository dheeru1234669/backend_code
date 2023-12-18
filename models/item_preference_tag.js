'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item_preference_tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item_preference_tag.init({
    item_id: DataTypes.INTEGER,
    preference_tag_id: DataTypes.INTEGER,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'item_preference_tag',
  });
  return item_preference_tag;
};
