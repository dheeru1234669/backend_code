'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class item_image extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  item_image.init({
    item_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
	enabled:{type:DataTypes.ENUM, values:['0','1']},
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}	
		
  }, {
    sequelize,
    modelName: 'item_image',
  });
  return item_image;
};
