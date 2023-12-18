var db          = require('../models');
const crypto    = require('crypto');
const { Op }    = require("sequelize");
var Common      = require('./Common')
var Dashboard   = require('./Dashboard')
var Tables      = require('./Table_management')

class Dashboard_table_manage{
    
    async table_assign(req, res){
        //const user_obj = await (new Common).get_data('user', {id:req.tokenValue.id, enabled:'1'})
        const user_obj = await (new Common).get_data('user', {role_id:[1,2,3], enabled:'1'})

        if(user_obj.raw_data && user_obj.raw_data.length)
        {
            var login_user_info = {}
            for(const all_users of user_obj.raw_data)
            {
                if(all_users.id == req.tokenValue.id)
                login_user_info = all_users

            }
            const pages_obj         = await (new Common).get_data('page',{'enabled':'1'})
            //var user_obj_row = user_obj.raw_data[0]
            var user_obj_row        = login_user_info
            var all_user_id_wise    = user_obj.id_wise 

            var user_section_parse  = JSON.parse(user_obj_row.user_section)
            var main_section        = user_obj_row.main_section

            var dashboard_section = []; var all_dashboards = [];
            if(user_section_parse && user_section_parse.dash)
            {
                for(const row_wise of user_section_parse.dash)
                {
                    var main  = main_section && row_wise == main_section ? 1 : 0
                    dashboard_section.push(row_wise)
                    all_dashboards.push({id:row_wise, name:pages_obj.id_wise[row_wise].name, main})
                }

               //if(dashboard_section.includes(String(app.WAITER_MANAGER)))
               if(1)
               {
                    const user_obj = await (new Dashboard).passcode_with_panel(req, res, 1)
                    const table_obj = await (new Tables).list_table(req, res, 1)

                    

                    var waiter_ids_cnt = {}
                    if(table_obj)
                    {
                        for(const row_wise of table_obj)
                        {
                            row_wise.waiter_name = ''; row_wise.waiter_color='';
                            if(row_wise.waiter_id)
                            {
                                if(all_user_id_wise[row_wise.waiter_id])
                                {
                                    var str = all_user_id_wise[row_wise.waiter_id].name+' '+all_user_id_wise[row_wise.waiter_id].surname;
                                    var matches = str.match(/\b(\w)/g);
                                    row_wise.waiter_name= matches.join('').toUpperCase()
                                    row_wise.waiter_color = all_user_id_wise[row_wise.waiter_id].name_bg_color
                                }

                                if(waiter_ids_cnt[row_wise.waiter_id])
                                waiter_ids_cnt[row_wise.waiter_id] += 1 
                                else
                                waiter_ids_cnt[row_wise.waiter_id] = 1
                            }
                        }
                    }

                    if(user_obj.waiter_data)
                    {
                        for(const row_wise of user_obj.waiter_data)
                        {
                            row_wise.assigned_table = waiter_ids_cnt[row_wise.id] ? waiter_ids_cnt[row_wise.id] : 0
                        }
                    }
                    console.log("waiter_ids_cnt= ", waiter_ids_cnt)
                    var api_data = {}
                    api_data['all_dashboards']  = all_dashboards
                    api_data['waiters']         = user_obj.waiter_data
                    api_data['tables']          = table_obj

                    return res.json({status:true, message:'Waiter and table list', type:'success', data:api_data})
               }
               else
               {
                return res.json({status:false, message:'Only Waiter Manager Access.', type:'warning', data:null}) 
               }
            }
        }
    }

    async waiter_table_assign(req, res){
        var validateObj = app.formValidate(req, ['table_with_waiter'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        var flag = 0
        if(body_parse.table_with_waiter)
        {
            var data = JSON.parse(body_parse.table_with_waiter)
            for (const [key, value] of Object.entries(data))
            {
                var update_data = {}
                update_data['waiter_id'] = value

                var where = {where:{id:key}}
                db.table.update(update_data,where).then(result=>{
                    flag=1
                }).catch(err=>{
                console.log("err84: ", err)
                })

                var insert_data = {}
                insert_data['table_id'] = key
                insert_data['waiter_id'] = value

                await db.table_waiter_map_history.create(insert_data).then(result=>{return result
                }).catch(err=>{console.log("err92: ", err)});
            }
        }
        if(flag == 1)
        {
           return res.json({status:true, message:'Mapped Successfully', type:'success', data:flag}); 
        }
        else
        {
            return res.json({status:false, message:'Some Thing went wrong', type:'warning', data:null});
        }
    }

    async waiter_table_re_assign(req, res){
        var validateObj = app.formValidate(req, ['table_id', 'waiter_id'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body

        var update_data = {}
        update_data['waiter_id'] = body_parse.waiter_id
    
        var where = {where:{id:body_parse.table_id}}
        db.table.update(update_data,where).then(result=>{
            return res.json({status:true, message:'Re assign Successfully.', type:'success', data:null});
        }).catch(err=>{
        return res.json({status:false, message:'Some Thing went wrong', type:'warning', data:null});    
        })
    }

    async assign_all_reset(req, res){
        var update_data = {}
        update_data['waiter_id'] = null

        var where = {where:{enabled:['0','1','2']}}
        db.table.update(update_data,where).then(result=>{
            return res.json({status:true, message:'Reset all tables.', type:'success', data:null});
        }).catch(err=>{
            return res.json({status:false, message:'Some Thing went wrong', type:'warning', data:null});
        })

    }

    async table_list(req, res){

        const table_obj = await (new Common).get_data('table', {enabled:'1'})
        if(table_obj.raw_data && table_obj.raw_data.length)
        {
            var status_id_wise  = await(new Tables).table_status_name(req, res, 1)

            var table_data = table_obj.raw_data
            var zone_arr = {}; var zone_combo = [{id:'all', name:'All Tables'}]
            var tbl_status_cnt = {}
            for(const row_wise of table_data)
            {
                zone_arr[row_wise.zone_id] = row_wise
            }
            const zone_obj = await (new Common).get_data('zone', {id:Object.keys(zone_arr), enabled:'1'})
            var table_data_mdfy = table_obj.raw_data
            for(const row_wise of table_data_mdfy)
            {
                row_wise.zone_name = zone_obj['id_wise'][row_wise.zone_id].name
                row_wise.status_name = status_id_wise['ID_WISE'][row_wise.status] ? status_id_wise['ID_WISE'][row_wise.status].status_name : '';
                row_wise.table_status_color = status_id_wise['ID_WISE'][row_wise.status] ? status_id_wise['ID_WISE'][row_wise.status].color : '';
                if(tbl_status_cnt[row_wise.status_name])
                tbl_status_cnt[row_wise.status_name]  += 1
                else
                tbl_status_cnt[row_wise.status_name]  = 1  

                zone_combo.push({id:row_wise.zone_id, name:row_wise.zone_name})
            }

            var api_data = {}
            api_data['tbl_status_cnt']  = tbl_status_cnt
            api_data['table_data']      = table_data_mdfy
            api_data['zone_combo']      = zone_combo
            

            return res.json({status:true, message:'table list', type:'success', data:api_data})
        }
        return res.json({status:false, message:'There is no data.', type:'warning', data:null})

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
module.exports = Dashboard_table_manage;
