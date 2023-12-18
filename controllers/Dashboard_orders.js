var db          = require('../models');
const crypto    = require('crypto');
const { Op }    = require("sequelize");
var Common      = require('./Common')
const moment    = require('moment-timezone');

class Dashboard_orders {
   
    async orders_fulfillment_wise(req, res){
        var validateObj = app.formValidate(req, ['fulfillment_area']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body

        var login_id = req.tokenValue.id
        const user_obj = await (new Common).get_data('user', {role_id:[app.ROLE_WAITER, app.ROLE_ADMIN], id:login_id, enabled:'1'})        
        console.log("user_obj== ", user_obj)
        if(user_obj.raw_data && user_obj.raw_data.length)
        {
            var user_obj_row    = user_obj.raw_data[0]
            var role_id         = user_obj_row.role_id
            var user_section_parse = JSON.parse(user_obj_row.user_section)    
            var dashboard_section = []; var all_dashboards = [];
            var fulfillment_section = []; var all_fulfillment = [];
            const pages_obj         = await (new Common).get_data('page',{'enabled':'1'})
            if(user_section_parse && user_section_parse.dash)
            {
                for(const row_wise of user_section_parse.dash)
                {
                    dashboard_section.push(row_wise)
                    var main = 0
                    all_dashboards.push({id:row_wise, name:pages_obj.id_wise[row_wise].name, main})
                }
            }

            if(user_section_parse && user_section_parse.fulfilment)
            {
                for(const row_wise of user_section_parse.fulfilment)
                {
                    fulfillment_section.push(row_wise)
                    all_fulfillment.push({id:row_wise, name:pages_obj.id_wise[row_wise].name})
                }
            }
            fulfillment_section = body_parse.fulfillment_area && body_parse.fulfillment_area.length ? JSON.parse(body_parse.fulfillment_area) : []
            var order_obj = await (new Dashboard_orders).orders({fulfillment_section, body_parse, login_id, role_id})
            var api_data = {}
            api_data['all_dashboards']  = all_dashboards
            api_data['order_obj']       = order_obj

            return res.json({status:true, message:'order details', type:'success', data:api_data})
        }
        return res.json({status:false, message:'There is no user', type:'warning', data:null})

    }

    async orders(args){
        var fulfillment_section = args.fulfillment_section
        var body_parse          = args.body_parse
        var login_id            = args.login_id
        var role_id             = args.role_id
        
        var order_status_constant = app.order_status_constant()
        var fulfillment_wise_order = {}; var fulfillment_wise_item_cnt = {};
        var order_summary = {}; var order_main_dtl = {}; var all_order_ids = [];
        var fulfillment_wise_order_status = {}; var max_prepared_time = {}; 
        var order_wise_waiter = {}; var all_waiter_ids = {};
        var order_wise_item_ids = {}; var order_created_time = {};

        var order_item_status = [order_status_constant.New, order_status_constant.Confirm, order_status_constant.Complete]
        if(body_parse.order_status == 'previous')
        order_item_status = [order_status_constant.Completed]

        if(fulfillment_section.length < 1)
        {
            var ret_data = {}
            ret_data['fulfillment_wise_order']  = fulfillment_wise_order
            ret_data['order_item_cnt']          = order_item_cnt

            return ret_data
        }
        fulfillment_section = fulfillment_section.map(item => item.id)
        console.log("fulfillment_section== ", fulfillment_section)
        var where = 'i.fulfillment_by in (?)'
            where += ' AND oi.status in (?)'

        var replacements = [fulfillment_section]
            replacements.push(order_item_status)

        if(role_id !=1)
        {
            where += ' AND o.waiter_id in(?)'
            replacements.push(login_id)
        }

        const query = `SELECT 
                i.id as items_id, 
                i.fulfillment_by,
                i.prepared_time,
                i.name,
                oi.id AS order_item_id, 
                oi.order_id, 
                oi.order_item_uid,
                oi.status AS order_item_status,
                oi.date_added AS order_item_created,
                oi.last_updated AS order_item_updated,
                o.order_uid,
                o.table_id,
                o.waiter_id,
                o.created_by,
                o.date_added AS order_created
            FROM 
                items AS i 
            INNER JOIN 
                order_items AS oi ON i.id = oi.item_id 
            INNER JOIN
                orders AS o ON o.id = oi.order_id
            WHERE ${where}`

        const [results, metadata] = await db.sequelize.query(query, { replacements });

        console.log("results== ", results) 
        var ret_data = {}
        ret_data['fulfillment_wise_order']  = []
        ret_data['order_summary']           = {}
        if(results && results.length > 0)
        {
            for(const row_wise of results)
            {
                row_wise.table_no = row_wise.table_id
                row_wise.order_no = row_wise.order_id

                var created_order = row_wise.order_created
                const date_time_mdfy = await (new Common).get_date_time(created_order)

                row_wise.created_date = date_time_mdfy['date']
                row_wise.created_time = date_time_mdfy['time']

                all_waiter_ids[row_wise.waiter_id]  = 1
                order_created_time[row_wise.order_id] = date_time_mdfy['date_time']

                if(fulfillment_wise_item_cnt[row_wise.order_id]){
                    fulfillment_wise_item_cnt[row_wise.order_id] += 1
                    max_prepared_time[row_wise.order_id].push(row_wise.prepared_time)
                    order_wise_item_ids[row_wise.order_id].push(row_wise.order_item_id)

                }else{
                    fulfillment_wise_item_cnt[row_wise.order_id] = 1
                    max_prepared_time[row_wise.order_id] = [row_wise.prepared_time]
                    order_wise_item_ids[row_wise.order_id] = [row_wise.order_item_id]
                }

                order_main_dtl[row_wise.order_id] = {table_no:row_wise.table_no, order_no:row_wise.order_no, waiter_id:row_wise.waiter_id}
                if (fulfillment_wise_order[row_wise.fulfillment_by]) 
                {
                    if (fulfillment_wise_order[row_wise.fulfillment_by][row_wise.order_id]) 
                    {
                        fulfillment_wise_order[row_wise.fulfillment_by][row_wise.order_id].push(row_wise);
                    } 
                    else 
                    {
                        fulfillment_wise_order[row_wise.fulfillment_by][row_wise.order_id] = [row_wise];
                    }
                } 
                else 
                {
                    fulfillment_wise_order[row_wise.fulfillment_by] = {[row_wise.order_id]: [row_wise]};
                }

            }
        
        var order_ids = Object.keys(fulfillment_wise_item_cnt)
        var waiter_ids= Object.keys(all_waiter_ids)

        ///////////
        var waiter_obj_dtl = {}
        if(waiter_ids.length)
        {
            const waiter_obj = await (new Common).get_data('user', {id:waiter_ids})
            if(waiter_obj.raw_data && waiter_obj.raw_data.length)
            {
                waiter_obj_dtl = waiter_obj.id_wise            
            }
        }
        ///////////
        console.log("order_ids====first== ", order_ids)
        if(order_ids.length)
        {
            console.log("order_ids== ", order_ids)
           const order_last_status = await (new Dashboard_orders).get_last_status({order_ids})

            const order_obj = await (new Common).get_data('order_item', {order_id:order_ids})
            const [results1, metadata1] = await db.sequelize.query(` 
                SELECT order_id, count(*) as cnt from order_items where order_id in(?) group by order_id
        `, {replacements: [order_ids]})


            if(results1)
            {
                for(const row_wise of results1)
                {
                    const prepared_times = max_prepared_time[row_wise.order_id];
                    const max_prepared_times = Math.max(...prepared_times);
                    var waiter_name = '';
                    order_main_dtl[row_wise.order_id]['waiter_assigned'] = '';
                    if(order_main_dtl[row_wise.order_id] && waiter_obj_dtl[order_main_dtl[row_wise.order_id].waiter_id])
                    {
                        waiter_name = waiter_obj_dtl[order_main_dtl[row_wise.order_id].waiter_id].name;
                        if(waiter_obj_dtl[order_main_dtl[row_wise.order_id].waiter_id].surname)
                        waiter_name += ' '+waiter_obj_dtl[order_main_dtl[row_wise.order_id].waiter_id].surname

                        var matches = waiter_name.match(/\b(\w)/g);
                        if(matches.length>0)
                        order_main_dtl[row_wise.order_id]['waiter_assigned']        = matches.join('').toUpperCase()
                    }
                

                    order_main_dtl[row_wise.order_id]['order_wise_total_items'] = row_wise.cnt
                    order_main_dtl[row_wise.order_id]['maximum_response_time']  = await (new Common).seconds_to_hms(max_prepared_times*60)
                    order_main_dtl[row_wise.order_id]['fulfillment_wise_item_ids'] = order_wise_item_ids[row_wise.order_id]
                    //var order_item_start = fulfillment_wise_order[fulfillment_section][row_wise.order_id][0].order_item_updated

                    var order_item_start = order_last_status['id_wise'][row_wise.order_id] && order_last_status['id_wise'][row_wise.order_id].confirmed_time ? order_last_status['id_wise'][row_wise.order_id].confirmed_time : ''
                    const date_time_mdfy = await (new Common).get_date_time(order_item_start)
                    order_main_dtl[row_wise.order_id]['order_start_date'] = date_time_mdfy['date']
                    order_main_dtl[row_wise.order_id]['order_start_time'] = date_time_mdfy['time']

                    var order_created = order_created_time[row_wise.order_id]
                    const date_and_time = order_created.split(','); 

                    order_main_dtl[row_wise.order_id]['order_created_date']     = date_and_time[0]
                    order_main_dtl[row_wise.order_id]['order_created_time']     = date_and_time[1]

                }
            }
        }
        
        if(order_ids.length)
        {
            var order_status_hash = app.order_status()
            for(const row_wise of order_ids)
            {
               for (const fulfill_row of fulfillment_section) {
                order_main_dtl[row_wise]['order_item_status'] = order_status_hash[fulfillment_wise_order[fulfill_row][row_wise][0].order_item_status]
                order_main_dtl[row_wise]['order_item_status_id'] = fulfillment_wise_order[fulfill_row][row_wise][0].order_item_status
               }
            }
        }
        var all_rows = []
        for (const fulfill_row of fulfillment_section) {
            if(fulfillment_wise_order[fulfill_row] != undefined)
            all_rows.push(fulfillment_wise_order[fulfill_row])
        }
        
        ret_data['fulfillment_wise_order']  = fulfillment_wise_order[fulfillment_section]
        ret_data['order_summary']           = {fulfillment_wise_item_cnt, order_main_dtl}

        console.log("ret_data=== ", ret_data)
        return ret_data
        }
        console.log("ret_data= ", ret_data)
        return ret_data

        
    };

    async get_last_status(args){
        const [results2, metadata2] = await db.sequelize.query(`
        SELECT t1.* FROM order_fulfillment_wise_prepared_times t1 JOIN (     SELECT order_id, MAX(confirmed_time) AS max_confirmed_time     FROM order_fulfillment_wise_prepared_times     GROUP BY order_id ) t2 ON t1.order_id = t2.order_id AND t1.confirmed_time = t2.max_confirmed_time AND t1.order_id in(?)
        `, {replacements: [args.order_ids]});

        var order_id_wise = {}
        if(results2 && results2.length)
        {
            for(const row_wise of results2)
            {
                order_id_wise[row_wise.order_id] = row_wise
            }
        }
        var ret_data = {}
        ret_data['id_wise'] = order_id_wise
        return ret_data

    }

    async order_status_update(req, res){
        var validateObj = app.formValidate(req, ['order_id', 'fulfillment_by_id', 'item_ids']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        console.log("body_parse=== ", body_parse)
        if(!body_parse.order_created)
        return res.json({status:false, message:'Order status required.', type:'warning', data:null});

        if(body_parse.order_created && !body_parse.order_created.order_item_status_id)
        return res.json({status:false, message:'Order status required.', type:'warning', data:null});
    
        var order_update_hash = {1:2, 2:3, 3:4}
        var update_data = {}
        update_data['status'] = order_update_hash[body_parse.order_created.order_item_status_id]

        var where = {where:{order_id:body_parse.order_id, id:JSON.parse(body_parse.item_ids)}}
        console.log("body_parse245== ", body_parse)

        db.order_item.update(update_data,where).then(async (result) => {
        var prepared_obj = await (new Dashboard_orders).prepared_time_log({body_parse})
        return res.json({status:true, message:'Order status updated successfully.', type:'success', data:update_data});
        }).catch(err=>{
        console.log("err== ", err)
        return res.json({status:false, message:'Some thing went wrong.', type:'warning', data:[]});
        })
    }

    async prepared_time_log(args){
        var body_parse = args.body_parse
        console.log("body_parse== ", body_parse)
        var order_id = body_parse.order_id
        var fulfillment_by_id= body_parse.fulfillment_by_id && body_parse.fulfillment_by_id.length ? JSON.parse(body_parse.fulfillment_by_id) : []
        fulfillment_by_id = fulfillment_by_id[0].id
        var order_created = body_parse.order_created.order_created_date+' '+ body_parse.order_created.order_created_time
        var before_confirm_time = body_parse.order_created.formattedstartTime
        var max_prepared_time   = body_parse.order_created.maximum_response_time
        var preparing_time      = body_parse.order_created && body_parse.order_created.formattedpreperationTime ? body_parse.order_created.formattedpreperationTime : null
        var order_status_change_after_update = app.order_status_change_after_update()
        var order_fulfillment_wise_status = order_status_change_after_update[body_parse.order_created.order_item_status_id]
        var confirmed_time = ''
        console.log("before_confirm_time===ee", before_confirm_time)
        if(before_confirm_time) 
        confirmed_time = await (new Dashboard_orders).get_confirmed_time({order_created, before_confirm_time})

        var insert_data = {}
        insert_data['order_id']             = order_id
        insert_data['fulfillment_by_id']    = fulfillment_by_id

        if(order_created)
        insert_data['order_created']        = order_created

        if(before_confirm_time)
        insert_data['before_confirm_time']  = before_confirm_time

        if(confirmed_time)
        insert_data['confirmed_time']       = confirmed_time

        if(max_prepared_time)
        insert_data['max_prepared_time']    = max_prepared_time

        if(preparing_time)
        insert_data['preparing_time']       = preparing_time

        insert_data['status']               = order_fulfillment_wise_status


        console.log("insert_data== ", insert_data) 
        return await db.order_fulfillment_wise_prepared_time.create(insert_data).then(result=>{         return result
        }).catch(err=>{console.log("err== ", err); return false;});
    }

    async get_confirmed_time(args){
        const originalDateTimeString = args.order_created
        const timeToAdd = args.before_confirm_time;
        const originalDateTime = moment(originalDateTimeString, "YYYY-MM-DD HH:mm:ss");
        const [hoursToAdd, minutesToAdd, secondsToAdd] = timeToAdd.split(':').map(Number);
        originalDateTime.add(hoursToAdd, 'hours');
        originalDateTime.add(minutesToAdd, 'minutes');
        originalDateTime.add(secondsToAdd, 'seconds');
        const formattedResult = originalDateTime.format("YYYY-MM-DD HH:mm:ss");
        return formattedResult
    }

}

module.exports = Dashboard_orders;
