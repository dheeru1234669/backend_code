'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class mapping_group_options extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  mapping_group_options.init({
    group_id: DataTypes.INTEGER,
    option_id: DataTypes.INTEGER,
	enabled:{type:DataTypes.ENUM, values:['0','1']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}	
	
  }, {
    sequelize,
    modelName: 'mapping_group_options',
  });
  return mapping_group_options;
};
