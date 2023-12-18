var db = require('../config/db.config.js')
var Common      = require('./Common');


class Customer{

    async login(req, res, call_type=null){
        var validateObj = app.formValidate(req, ['mobile']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null})

        var body_parse = req.body;
        const customer_obj = await (new Common).get_data('customer',{'mobile':body_parse.mobile})
        var insert_data = {}
        if(customer_obj.raw_data && customer_obj.raw_data.length)
        insert_data['id']       = customer_obj.raw_data[0].id

        insert_data['mobile']   = body_parse.mobile

        var ret_data = await(new Common).upsert_record('customer', insert_data)
        if(ret_data)
        {
            const theme_clr_obj = await (new Common).get_data('theme_color',{'enabled':'1'})
            theme_clr_obj.raw_data[0].logo = app.url+'/theme_images/'+theme_clr_obj.raw_data[0].logo
            var data = {}
            var token = app.token({id:ret_data.id});
            data.mobile = body_parse.mobile
            data.token = token
            data.theme  = theme_clr_obj.raw_data ? theme_clr_obj.raw_data[0] : ''

            if(call_type == 'inner')
            {
                data.id = ret_data.id
                return data
            }
            else
            {
                return res.json({status:true, message:'Proceed', type:'success', data});
            }
        }
        else
        {
            if(call_type == 'inner')
            return false
            else
            return res.json({status:false, message:'Some thing went wrong.', type:'error', data:null})
        }
    
         

    }

}

module.exports = Customer;
