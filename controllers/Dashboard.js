var db          = require('../models');
const crypto    = require('crypto');
const { Op }    = require("sequelize");
var Common      = require('./Common')

class Dashboard{

    async dashboard_data(req, res){
        var data = {}
        data['current_menu_items']  = 0;
        data['current_categories']  = 0;
        data['most_sold_item']      = '';
        data['least_sold_item']     = '';

        res.json({status:true, message:'Delete Successfully', type:'success', data});
    }

    async category_cnt(req, res){
        const [results, metadata] = await db.sequelize.query('select count(*) as cnt from categories where parent=? and enabled =?', {replacements: ['0','1']});
        if(results)
        {
            return results
        }
    }

    async passcode_with_panel(req, res, flag=null){
        const user_obj = await (new Common).get_data('user', {role_id:['1','2','3'], enabled:'1'})
        var restaurent_name = app.restaurent_name()

        var user_data = []; var waiter_data = [];
        if(user_obj.raw_data && user_obj.raw_data.length)
        {
            for(const row_wise of user_obj.raw_data)
            {
                var str = row_wise.name+' '+row_wise.surname;
                var matches = str.match(/\b(\w)/g);
                var user_row = {id:row_wise.id, name:row_wise.name, surname:row_wise.surname, name_bg_color:row_wise.name_bg_color, short_name:matches.join('').toUpperCase(), occupied_cnt:0} 
                if(row_wise.role_id == 1 || row_wise.role_id == 2)
                {
                    user_data.push(user_row)                       
                }
                else
                {
                    waiter_data.push(user_row)
                }
            }
            var api_data = {}
            api_data['restaurent_name'] = restaurent_name
            api_data['user_data']       = user_data
            api_data['waiter_data']     = waiter_data
            if(flag == 1)
            return api_data
            else
            return res.json({status:true, message:'user list', type:'success', data:api_data});
        }
        if(flag == 1)
        return false
        else
        return res.json({status:false, message:'There is no data', type:'warning', data:null});
    }

    async passcode(req, res){
        var validateObj = app.formValidate(req, ['passcode']);
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null});

        var body_parse = req.body;
        const user_obj = await (new Common).get_data('user',{pass_code:body_parse.passcode, enabled:'1'})
        if(user_obj.raw_data && user_obj.raw_data.length)
        {
            const pages_obj         = await (new Common).get_data('page',{'enabled':'1'})
            var data = {}
            var token       = app.token({id:user_obj.raw_data[0].id});
            var user_section_parse = JSON.parse(user_obj.raw_data[0].user_section)
            var main_section = user_obj.raw_data[0].main_section

            var dashboard_section_name = []; var dashboard_section = [];
            var all_dashboards = []; var all_fulfilment = [];
            if(user_section_parse && user_section_parse.dash)
            {
                for(const row_wise of user_section_parse.dash)
                {
                    var main = 0
                    if(pages_obj.id_wise && pages_obj.id_wise[row_wise])
                    {
                        dashboard_section_name.push(pages_obj.id_wise[row_wise].name)
                        dashboard_section.push(row_wise)
                        main  = main_section && row_wise == main_section ? 1 : 0
                        all_dashboards.push({id:row_wise, name:pages_obj.id_wise[row_wise].name, main})
                    }
                }
            }

            if(user_section_parse && user_section_parse.fulfilment)
            {
                for(const row_wise of user_section_parse.fulfilment)
                {
                    if(pages_obj.id_wise && pages_obj.id_wise[row_wise])
                    {
                        //fulfilment_section_name.push(pages_obj.id_wise[row_wise].name)
                        //fulfilment_section.push(row_wise)
                        all_fulfilment.push({id:row_wise, name:pages_obj.id_wise[row_wise].name, main})
                    }
                }
            }
            /*data.screen = '';
            if(dashboard_section.includes(String(app.WAITER_MANAGER)))
            {
                data.screen = 'waiter_manager';
            }
            if(dashboard_section.includes(String(app.TABLE_MANAGEMENT)))
            {
                data.screen = 'table_management';
            }*/

            data.passcode       = body_parse.passcode
            data.token          = token
            data.all_dashboards = all_dashboards
            data.all_fulfillment = all_fulfilment

            return res.json({status:true, message:'Success.', type:'success', data});
        }
        else
        {
            return res.json({status:false, message:'Incorrect Passcode.', type:'error', data:null})
        }

    }

    async waiter_schedule(req, res){
        const next_seven_dates = await (new Dashboard).next_six_dates();
            

        var api_data = {}
        api_data['schedule'] = next_seven_dates
        res.json({status:true, message:'Delete Successfully', type:'success', data:api_data});
    }

    async next_six_dates() {
        const user_obj = await (new Common).get_data('user', {role_id:['3'], enabled:'1'})
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        var todate_date = `${year}-${month}-${day}`

        var date_wise_waiter_arr = []; var date_wise = {};
        date_wise_waiter_arr = await db.date_wise_waiter_present.findAll({
                            where: {
                                date: {
                                    [Op.gte]: todate_date,
                                },
                            },
                            raw: true,
                            })
                            .then(results =>{
                                results.map(async row_wise=>{
                                    date_wise[row_wise.date] = row_wise
                                })
                                return date_wise
                            })
                            .catch(error => {

                            });

        console.log("date_wise_waiter_arr:", date_wise_waiter_arr)
        var dates = []; var dates_wise_present = []

        for (let i = 0; i < 7; i++) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(currentDate.getDate() + i);
            if(i == 0)
            dates = ['Today']
            else
            dates.push(await (new Dashboard).formatDate(nextDate));

            var date_mdfy = nextDate.toISOString().split('T')[0]
            var row = {}
            row['date'] =date_mdfy
            row['schedule'] = 0
            row['date_wise_waiter'] = date_wise_waiter_arr[date_mdfy] && date_wise_waiter_arr[date_mdfy].waiter_ids ? date_wise_waiter_arr[date_mdfy].waiter_ids : []

            dates_wise_present.push(row)
        }
        
        var waiter_wise_dates = {}
        if(user_obj.raw_data && user_obj.raw_data.length)
        {
            for(const row_wise of user_obj.raw_data)
            {
                waiter_wise_dates[row_wise.id]= {dates_wise_present, color:row_wise.name_bg_color}
            }
        }

        var ret_data = {}
        ret_data['dates']           = dates
        ret_data['waiters']         = waiter_wise_dates
        ret_data['waiters_date']    = date_wise_waiter_arr
        return ret_data;
    }

    async formatDate(date) {
        const options = { weekday: 'short', day: 'numeric', month: 'short' };
        return new Intl.DateTimeFormat('en-US', options).format(date);
    }

    async waiter_schedule_update(req, res){
        var body_parse = req.body;
        console.log("body_parse188==", body_parse)
        var prse = JSON.parse(body_parse.schedule)
        var bulk_data = []; var dates = []; var date_wise = {}
        for (const item of JSON.parse(body_parse.schedule)){
            for (const key in item) {
                dates.push(key)
                date_wise[key] = JSON.stringify(item[key])
            }
        }

        var update_data = []; var insert_data = []; var flag = 0;
        const date_wise_waiter_obj = await (new Common).get_data('date_wise_waiter_present', {date:dates})
            if(date_wise_waiter_obj.raw_data && date_wise_waiter_obj.raw_data.length)
            {
                for(const row_wise of date_wise_waiter_obj.raw_data)
                {
                    if(date_wise[row_wise.date])
                    {
                        flag=1
                        var update_data = {}
                        update_data['waiter_ids'] = date_wise[row_wise.date]

                        var where = {where:{date:row_wise.date}}
                        db.date_wise_waiter_present.update(update_data,where).then(result=>{
                        flag=1
                        }).catch(err=>{

                        })
                        delete date_wise[row_wise.date];
                    }
                    
                }
            }
            if(Object.keys(date_wise).length)
            {
                for (const item of [date_wise]){
                    for (const key in item) {
                    var row = {}
                    row['date'] = key
                    row['waiter_ids'] = item[key]

                    insert_data.push(row)
                }}
            }
        if(insert_data.length>0)
        {
            await db.date_wise_waiter_present.bulkCreate(insert_data).then(result=>{
            return res.json({status:true, message:'schedule update', type:'success', data:result});
            }).catch(err=>{
            return res.json({status:false, message:err, type:'warning', data:[]});
            });
        }
        else if(flag == 1)
        {
            return res.json({status:true, message:'schedule update', type:'success', data:body_parse});
        }
        else
        {
            return res.json({status:false, message:'Something went wrong.', type:'warning', data:[]});
        }
        
    }

    async waiter_table_list(req, res){
           
        
    }



}

module.exports = Dashboard;
