var db              = require('../models');
var Table_management= require('./Table_management');

class Waiter_table{
    
    async tables(req, res){
        var tables  = await(new Table_management).list_table(req, res, 1)
        if(tables)
        {
            var api_data = {}
            api_data['my']  = tables
            api_data['all'] = tables 
            return res.json({status:true, message:'Table list', type:'success', data:api_data});
        }
        else
        {
            return res.json({status:false, message:'Something went wrong', type:'error', data:null});
        }
    }

    async update_table_status(req, res){
        var validateObj = app.formValidate(req, ['id', 'status'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null})

        var body_parse = req.body;
        var update_data = {};
        update_data['status'] = body_parse.status

        var where = {where:{id:body_parse.id}}

        db.table.update(update_data,where).then(result=>{
        return res.json({status:true, message:'success', type:'success', data:update_data});
        }).catch(err=>{
        return res.json({status:false, message:'error', type:'error', data:err});
        });

    }
}
module.exports = Waiter_table;
