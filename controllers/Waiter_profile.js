var db          = require('../models');
var Common      = require('./Common');

class Waiter_profile{

    async profile_old(req, res){
        const [results, metadata] = await db.sequelize.query('select * from users where enabled  = ? and id = ? and role_id = ?', {replacements: ['1', req.tokenValue.id, 3]});
        if(results)
        {
            const admin_section_obj = await (new Common).get_data('admin_section',{'enabled':'1'})
            const pages_obj         = await (new Common).get_data('page',{'enabled':'1'})
            const user_loc_obj      = await (new Common).get_data('user_location',{'enabled':'1'})

            var user_obj = results[0]
            var str = user_obj.name+' '+user_obj.surname;
            var matches = str.match(/\b(\w)/g);
            var admin_section = user_obj.admin_section ? JSON.parse(user_obj.admin_section) : ''
            var admin_section_name = '';

            for(const inner_row of admin_section)
            {
                admin_section_name += admin_section_obj.id_wise[inner_row].name+', '    
            }


            admin_section_name = admin_section_name.replace(/,\s*$/, "");

            var user_section_parse = JSON.parse(user_obj.user_section)

            var loc_section_name = ''; var loc_arr = [];
            for(const inner_row of user_section_parse.loc)
            {
                if(pages_obj.id_wise && user_loc_obj.id_wise[inner_row])
                loc_section_name += user_loc_obj.id_wise[inner_row].name+', '

                loc_arr.push(parseInt(inner_row))
            }
            loc_section_name = loc_section_name.replace(/,\s*$/, "")

            var dashboard_section_name = ''; var dash_arr = [];
            for(const inner_row of user_section_parse.dash)
            {
                if(pages_obj.id_wise && pages_obj.id_wise[inner_row])
                dashboard_section_name += pages_obj.id_wise[inner_row].name+', '

                dash_arr.push(parseInt(inner_row))
            }

            var user_section_parse = JSON.parse(user_obj.user_section)

            var loc_section_name = ''; var loc_arr = [];
            for(const inner_row of user_section_parse.loc)
            {
                if(pages_obj.id_wise && user_loc_obj.id_wise[inner_row])
                loc_section_name += user_loc_obj.id_wise[inner_row].name+', '

                loc_arr.push(parseInt(inner_row))
            }
            loc_section_name = loc_section_name.replace(/,\s*$/, "")

            var dashboard_section_name = ''; var dash_arr = [];
            for(const inner_row of user_section_parse.dash)
            {
                if(pages_obj.id_wise && pages_obj.id_wise[inner_row])
                dashboard_section_name += pages_obj.id_wise[inner_row].name+', '

                dash_arr.push(parseInt(inner_row))
            }
            dashboard_section_name = dashboard_section_name.replace(/,\s*$/, "")

            var fulfil_arr = [];
            for(const inner_row of user_section_parse.fulfilment)
            {
                fulfil_arr.push(parseInt(inner_row))
            }
            
            user_obj.short_name = matches.join('').toUpperCase()
            user_obj.locations  = loc_section_name;
            user_obj.loc_ids  = loc_arr;
            user_obj.dash_ids  = dash_arr;
            user_obj.fulfillment_ids  = fulfil_arr;
            user_obj.dashboard_admin_section = dashboard_section_name+', '+admin_section_name

            res.json({status:true, message:'Profile Data', type:'success', data:user_obj});
        }
        else
        {
            res.json({status:false, message:'There is no data', type:'warning', data:[]});
        }
   
   }

    async profile(req, res){
        const [results, metadata] = await db.sequelize.query('select * from users where enabled  = ? and id = ? and role_id = ?', {replacements: ['1', req.tokenValue.id, 3]});
        if(results)
        {
            var user_obj = results[0]
            var str = user_obj.name
            if(user_obj.surname)
            str += ' '+ user_obj.surname 

            var user_dtl = {}
            user_dtl.name = str
            user_dtl.passport_no = 'rttr'
            user_dtl.mobile = '9876543211'
            user_dtl.role_name = 'Waiter'

            res.json({status:true, message:'Profile Data', type:'success', data:user_dtl});
        }
        else
        {
            res.json({status:false, message:'There is no data', type:'warning', data:[]});
        }
    }
}

module.exports = Waiter_profile;
