'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class theme_color extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  theme_color.init({
    bgcolor: DataTypes.STRING,
    cardbg: DataTypes.STRING,
    textlines: DataTypes.STRING,
    btncolor: DataTypes.STRING,
    btntext: DataTypes.STRING,
    logo: DataTypes.STRING,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'theme_color',
  });
  return theme_color;
};
