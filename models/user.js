'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  user.init({
    user_uid: DataTypes.STRING,
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    mobile: DataTypes.STRING,
    surname: DataTypes.STRING,
    pass_code: DataTypes.STRING,
    passport_no: DataTypes.STRING,
    password: DataTypes.STRING,
    location_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER,
    page_ids:DataTypes.TEXT,
    user_section:DataTypes.TEXT,
    admin_section:DataTypes.TEXT,
    main_section:DataTypes.STRING,
    name_bg_color:DataTypes.STRING,
    calling_status:{type:DataTypes.ENUM, values:['0','1']},
    enabled:{type:DataTypes.ENUM, values:['0','1','2']},
    createdAt: {type:DataTypes.DATE, field: 'date_added'},
    updatedAt: {type:DataTypes.DATE, field: 'last_updated'}
  }, {
    sequelize,
    modelName: 'user',
  });
  return user;
};
