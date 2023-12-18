'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class locations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  locations.init({
    name: DataTypes.STRING,
    address_1: DataTypes.STRING,
    address_2: DataTypes.STRING,
    address_3: DataTypes.STRING,
    suburban: DataTypes.STRING,
    city: DataTypes.STRING,
    postal_code: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.INTEGER,
    phone_1: DataTypes.INTEGER,
    phone_2: DataTypes.INTEGER,
    email: DataTypes.STRING,
    image: DataTypes.STRING,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'locations',
  });
  return locations;
};
