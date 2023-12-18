'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class preference_tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  preference_tag.init({
    name: DataTypes.STRING,
    preference_type: DataTypes.STRING,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    is_active:{type:DataTypes.ENUM, values:['0','1']},
    image: DataTypes.STRING,
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'preference_tag',
  });
  return preference_tag;
};
