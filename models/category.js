'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  category.init({
    cat_uid: DataTypes.STRING,
    name: DataTypes.STRING,
    image: DataTypes.STRING,
    parent: DataTypes.INTEGER,
	header_type:{type:DataTypes.ENUM, values:['img','txt']},	
	is_hidden:{type:DataTypes.ENUM, values:['0','1']},
	is_enabled_time:{type:DataTypes.ENUM, values:['0','1']},
    is_add_item:{type:DataTypes.ENUM, values:['0','1']},
	enabled:{type:DataTypes.ENUM, values:['0','1','2']},
	createdAt: {type:DataTypes.DATE, field: 'date_added'},
	updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'category',
  });
  return category;
};
