var db = require('../config/db.config.js')
var Common      = require('./Common');

class Waiter{

    async login(req, res){
        var validateObj = app.formValidate(req, ['email', 'password']);
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null});

        var body_parse = req.body;
        const waiter_obj = await (new Common).get_data('user',{email:body_parse.email, password:body_parse.password, enabled:'1'})
        var insert_data = {}
        if(waiter_obj.raw_data && waiter_obj.raw_data.length)
        {
            var data = {}
            var token = app.token({id:waiter_obj.raw_data[0].id});
            data.email = body_parse.email
            data.token = token
            
            return res.json({status:true, message:'Successfully Login', type:'success', data});
        }
        else
        {
            return res.json({status:false, message:'Wrong credential.', type:'error', data:null})
        }

    } 
}

module.exports = Waiter;
