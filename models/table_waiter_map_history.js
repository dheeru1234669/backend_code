'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class table_waiter_map_history extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  table_waiter_map_history.init({
    table_id: DataTypes.INTEGER,
    waiter_id: DataTypes.INTEGER,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'table_waiter_map_history',
  });
  return table_waiter_map_history;
};
