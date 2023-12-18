'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class theme_msg extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  theme_msg.init({
    welcome_msg: DataTypes.STRING,
    welcome_msg_desc: DataTypes.STRING,
    land_page_msg: DataTypes.STRING,
    order_conf_1: DataTypes.STRING,
    order_conf_2: DataTypes.STRING,
    order_conf_3: DataTypes.STRING,
    order_conf_4: DataTypes.STRING,
    order_rec_1: DataTypes.STRING,
    order_rec_2: DataTypes.STRING,
    order_rec_3: DataTypes.STRING,
    order_rec_4: DataTypes.STRING,
    call_order_rec_1: DataTypes.STRING,
    call_order_rec_2: DataTypes.STRING,
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'theme_msg',
  });
  return theme_msg;
};
