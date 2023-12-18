var db = require('../../models');
const { Op } = require("sequelize");

class Index{
    async get_data(args){
        var table =args.name
        table = db.table
        //var where = {where:{id:body_parse.user_id}, raw:true}
        var condition = {}; var param = {};
         
        for (const [key, value] of Object.entries(JSON.parse(args.where))) {
            condition[key] = value
        }
        console.log("where== ", where, table)
        var where = {where:condition}
        await table.findOne(where).then(result=>{
        return result
        }).catch(err=>{
        return err
        })
        
    }
}
module.exports = Index;
