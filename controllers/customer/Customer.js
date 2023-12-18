var db = require('../../config/db.config.js')
var Common      = require('../Common');


class Customer{

    async login(req, res){
        var validateObj = app.formValidate(req, ['mobile']);
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null});

        var body_parse = req.body;
        const customer_obj = await (new Common).get_data('customer',{'mobile':body_parse.mobile})
        var insert_data = {}
        if(customer_obj)
        insert_data['id']       = customer_obj.id

        insert_data['mobile']   = body_parse.mobile
        var ret_data = await(new Common).upsert_record('customer', insert_data)
        if(ret_data)
        return res.json({status:true, message:'Proceed', type:'success', data:ret_data});
        else
        return res.json({status:false, message:'Some thing went wrong.', type:'error', data:null})
    
         

    }

}

module.exports = Customer;
