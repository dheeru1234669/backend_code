var db                  = require('../models');
const crypto            = require('crypto');
const { Op }            = require("sequelize");
var Common              = require('./Common')
var Customer_category   = require('./Customer_category')

class Dashboard_assembly {
    

    async orders(req, res){
        var validateObj = app.formValidate(req, ['order_status']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        var login_id = req.tokenValue.id

        var order_status_constant = app.order_status_constant()
        var order_item_status = [order_status_constant.New, order_status_constant.Confirm, order_status_constant.Complete]
        if(body_parse.order_status == 'previous')
        order_item_status = [order_status_constant.Ready_to_deliver]

        const [results, metadata] = await db.sequelize.query(`
            SELECT 
                i.id as items_id, 
                i.fulfillment_by,
                i.prepared_time,
                i.name,
                oi.item_id AS order_item_id, 
                oi.order_id, 
                oi.order_item_uid,
                oi.status AS order_item_status,
                oi.modifier_group,
                oi.extra_group,
                oi.quantity,
                oi.is_assembled,
                o.order_uid,
                o.status AS order_status,
                o.table_id,
                o.waiter_id,
                o.created_by
            FROM 
                items AS i 
            INNER JOIN 
                order_items AS oi ON i.id = oi.item_id 
            INNER JOIN
                orders AS o ON o.id = oi.order_id
            WHERE 
                oi.status in (?)
            `, {replacements: [order_item_status]})

            var order_wise = {}; var order_wise_item = {}
            var all_item_ids = {}; var all_waiters_ids = {}
            var order_count = {};
            if(results && results.length > 0)
            {
               var all_data = []; var order_main_dtl = {} 
               for(const row_wise of results)
               {
                    row_wise.fulfillment_by_name    = 'cT' //STATIC
                    row_wise.item_qty               = row_wise.quantity
                    row_wise.item_prepared_qty      = 2 //STATIC

                    row_wise.modifier_group         = row_wise.modifier_group ? JSON.parse(row_wise.modifier_group) : []
                    row_wise.extra_group            = row_wise.extra_group ? JSON.parse(row_wise.extra_group) : []
                    if(order_wise[row_wise.order_id]){
                    order_wise[row_wise.order_id].push(row_wise)
                    order_wise_item[row_wise.order_id].push(row_wise.order_item_id)
                    }else{
                    order_wise[row_wise.order_id] = [row_wise]
                    order_wise_item[row_wise.order_id] = [row_wise.order_item_id]
                    }

                    all_item_ids[row_wise.order_item_id]    = 1
                    all_waiters_ids[row_wise.waiter_id]     = 1

                    order_main_dtl[row_wise.order_id] = {
                        order_no:row_wise.order_id, 
                        table_no:row_wise.table_id,
                        waiter_id:row_wise.waiter_id,
                        created_by:row_wise.created_by,
                        order_status:row_wise.order_status
                    }
                   
               }
               console.log("order_wise== ", order_wise)
                const item_detail_obj   = await (new Dashboard_assembly).item_detail({all_item_ids});
                const waiter_detail_obj = Object.keys(all_waiters_ids).length ? await (new Dashboard_assembly).waiter_detail({all_waiters_ids}) : [];
                var item_info   = item_detail_obj['id_wise'];
                var waiter_info = waiter_detail_obj['id_wise'];

                var fulfillment_names = {}; var order_wise_prepared_time = {};
                var item_images      = {};

                for(const row_wise of results)
                {
                    row_wise.table_no = row_wise.table_id
                    row_wise.order_no = row_wise.order_id

                    var fulfillment_name_str = ''; var prepared_time = '';
                    if(item_info[row_wise.order_item_id])
                    {
                        fulfillment_name_str = item_info[row_wise.order_item_id] && item_info[row_wise.order_item_id].fulfillment_short_name ? item_info[row_wise.order_item_id].fulfillment_short_name : ''
                        prepared_time = item_info[row_wise.order_item_id].prepared_time ? item_info[row_wise.order_item_id].prepared_time : ''
                        item_images[row_wise.order_item_id] = item_detail_obj.item_images.item_id_wise[row_wise.order_item_id] && item_detail_obj.item_images.item_id_wise[row_wise.order_item_id].length ? item_detail_obj.item_images.item_id_wise[row_wise.order_item_id][0] : {img_url:app.url+'/loc_images/location-profile.PNG'}

                    } 

                    if(fulfillment_names[row_wise.order_id]){
                    fulfillment_names[row_wise.order_id].push(fulfillment_name_str)
                    order_wise_prepared_time[row_wise.order_id].push(prepared_time)
                    }else{
                    fulfillment_names[row_wise.order_id] = [fulfillment_name_str]
                    order_wise_prepared_time[row_wise.order_id] = [prepared_time]
                    }

                }

                    for (const key in order_main_dtl) 
                    {
                        if (order_main_dtl.hasOwnProperty(key)) 
                        {
                            const order_wise_cnt    = order_wise[key];
                            const order_details     = order_main_dtl[key];
                            const fulfillment_name_arr = fulfillment_names[key];
                            var max_prepared_time   = order_wise_prepared_time[key];

                            var row = {}
                            row['order_no']     = order_details.order_no
                            row['table_no']     = order_details.table_no
                            row['waiter']       = waiter_info[order_details.waiter_id] ? waiter_info[order_details.waiter_id].short_name : ''
                            row['fulfillment']  = fulfillment_name_arr
                            row['created_by']   = order_details.created_by
                            row['max_prepared_time'] = Math.max(...order_wise_prepared_time[key])
                            row['total_items']  = order_wise_cnt.length ? order_wise_cnt.length : 0
                            row['item_detail']  = order_wise_cnt

                            all_data.push(row)

                            if(order_count[order_details.order_status])
                            order_count[order_details.order_status] +=1
                            else
                            order_count[order_details.order_status] = 1

                        }
                    }

                var api_data = {}
                api_data['order_count'] = order_count
                api_data['item_images'] = item_images
                api_data['order']       = all_data
                


               return res.json({status:true, message:'order details', type:'success', data:api_data}) 

            }
            return res.json({status:false, message:'There is no data.', type:'warning', data:null})
    }

    async item_detail(args){
        var all_item_ids = Object.keys(args.all_item_ids)
        const item_obj = await (new Common).get_data('item', {id:all_item_ids})
        var item_images     = await(new Customer_category).item_images({only_visible_item_ids:all_item_ids})
        const fulfillment_obj = await (new Common).get_data('fulfilment_station', {enabled:'1'})

        var item_id_wise = {}
        if(item_obj.raw_data && item_obj.raw_data.length)
        {
            for(const row_wise of item_obj.raw_data)
            {
                var str = fulfillment_obj['id_wise'][row_wise.fulfillment_by] ? fulfillment_obj['id_wise'][row_wise.fulfillment_by].name : '';
                var matches = str.match(/\b(\w)/g);
                row_wise.fulfillment_short_name = matches.length ? matches.join('').toUpperCase() : ''
                item_id_wise[row_wise.id]  = row_wise      
            }
        }
        var ret_data = {}
        ret_data['id_wise']     = item_id_wise
        ret_data['item_images'] = item_images

        return ret_data

    }

    async waiter_detail(args){
        var all_waiter_ids = Object.keys(args.all_waiters_ids)
        const waiter_obj = await (new Common).get_data('user', {id:all_waiter_ids})

        var waiter_id_wise = {}
        if(waiter_obj.raw_data && waiter_obj.raw_data.length)
        {
           for(const row_wise of waiter_obj.raw_data)
           {
                var str = row_wise.name+' '+row_wise.surname;
                var matches = str.match(/\b(\w)/g);
                row_wise.short_name = matches.join('').toUpperCase()
                waiter_id_wise[row_wise.id] = row_wise
           }
        }
        var ret_data = {}
        ret_data['id_wise'] = waiter_id_wise

        return ret_data
    }


    async order_to_assembled(req, res){
        var validateObj = app.formValidate(req, ['order_id', 'order_item_uid', 'is_assembled']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        console.log("body_parse215==", body_parse)
        var update_data = {}
        update_data['is_assembled']     = body_parse.is_assembled == true ? '1' : '0'

        var where = {where:{order_id:body_parse.order_id, order_item_uid:body_parse.order_item_uid}};
        console.log("update_data== ", update_data)
        return await db.order_item.update(update_data,where).then(result=>{
            res.json({status:true, message:'Assembled status change', type:'success', data:null});
        }).catch(err=>{
            console.log("erroo== ", err)
            res.json({status:false, message:'Something went wrong', type:'warning', data:null});
        });
    }
}

module.exports = Dashboard_assembly;

