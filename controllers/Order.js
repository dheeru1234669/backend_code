var db                  = require('../models');
var Common              = require('./Common')
var Customer            = require('./Customer')
var Customer_category   = require('./Customer_category')
var Cart                = require('./Cart')
const crypto            = require('crypto');
const moment            = require('moment-timezone');

class Order{

    async save_order(req, res){
        var validateObj = app.formValidate(req, ['save_order', 'table_id'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        const table_obj     = await (new Common).get_data('table',{id:body_parse.table_id})
        if(table_obj.raw_data && table_obj.raw_data.length < 1)
        {
            return res.json({status:false, message:'No Table found.', type:'warning', data:null});    
        }

        const cart_detail_obj = await (new Cart).cart_detail(req, res, 'inner', 'customer')
        console.log("cart_detail_obj", cart_detail_obj) 
        if(cart_detail_obj)
        {
            const order_obj = await (new Order).save_order_func(req, {cart_detail_obj, user_obj:'', table_obj, call_type:'customer'})
            console.log("order_obj", order_obj)
            if(order_obj && order_obj.id)
            {
                const order_item_obj = await (new Order).save_order_item(req, {cart_detail_obj, order_id:order_obj.id, call_type:'customer'})
                await (new Common).delete_records('cart', {customer_id:req.tokenValue.id})
                return res.json({status:true, message:'Order Created Successfully', type:'success', data:order_item_obj});
            }
        }
        return res.json({status:false, message:'There is no data.', type:'warning', data:null})
    }

    async save_order_func(req, args){
        var cart_detail_obj = args.cart_detail_obj
        var user_obj        = args.user_obj
        var call_type       = args.call_type
        var table_obj       = args.table_obj
        
        var customer_id = call_type == 'waiter' ? user_obj.id : req.tokenValue.id

        var insert_data = {}
        insert_data['order_uid']    = await (new Common).unique_number() 
        insert_data['customer_id']  = customer_id
        insert_data['table_id']     = table_obj.raw_data[0].id
        insert_data['waiter_id']    = table_obj.raw_data[0].waiter_id
        insert_data['subtotal']     = cart_detail_obj.total_amount_no_symbol 
        insert_data['total']        = cart_detail_obj.total_amount_no_symbol
        insert_data['payment_mode'] = 1
        insert_data['status']       = 1
        insert_data['created_by']   = call_type == 'waiter' ? 'waiter' : 'customer'

        return await db.order.create(insert_data).then(result=>{
        return result
        }).catch(err=>{
        return false
        });

    }

    async save_order_item(req, args){
        var cart_detail_obj = args.cart_detail_obj
        var order_id        = args.order_id

        var bulk_data = [];
        if(cart_detail_obj.cart_item && cart_detail_obj.cart_item.length)
        {
            for(const row_wise of cart_detail_obj.cart_item)
            {
                var row = {}
                row['order_item_uid']   = await (new Common).unique_number()
                row['order_id']         = order_id
                row['customer_id']      = req.tokenValue.id
                row['item_id']          = row_wise.item_id
                row['varient_id']       = row_wise.varient_id
                row['modifier_group']   = JSON.stringify(row_wise.modifier_group_option_arr)
                row['extra_group']      = JSON.stringify(row_wise.extra_group_option_arr)
                row['quantity']         = row_wise.qty
                row['subtotal']         = row_wise.price_no_symbol
                row['total']            = row_wise.price_no_symbol
                row['status']           = 1

                bulk_data.push(row)
            }
            if(bulk_data.length>0)
            {
                return await db.order_item.bulkCreate(bulk_data).then(result=>{
                return result
                }).catch(err=>{
                return false;
                });
            }
            else
            {
                return false
            }

        }
    }

    async save_order_by_waiter(req, res){
        var validateObj = app.formValidate(req, ['save_order', 'mobile', 'table_id'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body

        const user_obj = await (new Customer).login(req, res, 'inner')
        if(!user_obj.id)
        return res.json({status:false, message:'No user found.', type:'warning', data:null});

        const table_obj     = await (new Common).get_data('table',{id:body_parse.table_id})
        if(table_obj.raw_data && table_obj.raw_data.length < 1)
        {
            return res.json({status:false, message:'No Table found.', type:'warning', data:null});    
        }
        else if(table_obj.raw_data[0] && !table_obj.raw_data[0].waiter_id)
        {
            return res.json({status:false, message:'No Waiter ID Found.', type:'warning', data:null});
        }


        const cart_detail_obj = await (new Cart).cart_detail(req, res, 'inner', 'waiter')
        if(cart_detail_obj)
        {
            const order_obj = await (new Order).save_order_func(req, {cart_detail_obj, user_obj, table_obj, call_type:'waiter'})
            console.log("order_obj", order_obj)
            if(order_obj && order_obj.id)
            {
                const order_item_obj = await (new Order).save_order_item(req, {cart_detail_obj, order_id:order_obj.id, call_type:'waiter'})
                await (new Common).delete_records('cart', {customer_id:req.tokenValue.id})
                return res.json({status:true, message:'Order Created Successfully', type:'success', data:order_item_obj});
            }
        }
        return res.json({status:false, message:'There is no data.', type:'warning', data:null})
    }

    async order_history(req, res){
        const order_obj     = await (new Common).get_data('order',{customer_id:req.tokenValue.id})
        const order_item_obj= await (new Common).get_data('order_item',{order_id:Object.keys(order_obj.id_wise)}) 
        var currency_icon   = await(new Common).currency_icon()

        if(order_item_obj.raw_data && order_item_obj.raw_data.length)
        {
            var order_id_wise = {}; var all_order_total = 0
            for(const row_wise of order_item_obj.raw_data)
            {
                row_wise.price_with_qty = currency_icon+''+(row_wise.subtotal * row_wise.quantity).toFixed(2)
                row_wise.subtotal = currency_icon+''+row_wise.subtotal
                row_wise.total = currency_icon+''+row_wise.total
                const item_obj     = await (new Common).get_data('item',{id:row_wise.item_id})
                if(item_obj.raw_data && item_obj.raw_data.length)
                row_wise.name = item_obj.raw_data[0].name
                row_wise.modifier_group = row_wise.modifier_group ? JSON.parse(row_wise.modifier_group) : ''
                row_wise.extra_group    = row_wise.extra_group ? JSON.parse(row_wise.extra_group) : ''

                if(order_id_wise[row_wise.order_id])
                order_id_wise[row_wise.order_id].push(row_wise)
                else
                order_id_wise[row_wise.order_id] = [row_wise]
            }
        
            if(order_obj.raw_data && order_obj.raw_data.length)
            {
                var payment_mode = app.payment_mode()
                var order_status_name = app.order_status()
                var orders_arr = order_obj.raw_data
                for(const row_wise of orders_arr)
                {
                    all_order_total += Number(row_wise.total)
                    var created_order = row_wise.createdAt
                    const date_time_mdfy= await (new Common).get_date_time(created_order)
                    const tbl_obj     = await (new Common).get_data('table',{id:row_wise.table_id})

                    row_wise.created_date = date_time_mdfy['date']
                    row_wise.created_time = date_time_mdfy['time']

                    row_wise.total = currency_icon+''+row_wise.total
                    row_wise.subtotal = currency_icon+''+row_wise.subtotal
                    row_wise.order_items =  order_id_wise[row_wise.id]
                    row_wise.payment_mode= payment_mode[row_wise.payment_mode]
                    row_wise.order_status_name = order_status_name[row_wise.status]
                    row_wise.table_name = tbl_obj.id_wise[row_wise.table_id] ? tbl_obj.id_wise[row_wise.table_id].name : ''
                }
            }
            var api_data = {}
            api_data['all_order_total_price']   = currency_icon+''+all_order_total.toFixed(2)
            api_data['orders']              =   orders_arr

            return res.json({status:true, message:'Order History.', type:'success', data:api_data})
        }

        return res.json({status:false, message:'There is no data.', type:'warning', data:null})
    }

    async order_history_waiter(req, res){
        var order_status_constant = app.order_status_constant()
        const order_obj     = await (new Common).get_data('order',{waiter_id:req.tokenValue.id, status:order_status_constant['Paid']})

        var customer_ids = []; var table_ids = []; var waiter_ids = [];
        var order_ids = [];
        if(order_obj.raw_data && order_obj.raw_data.length){
            for(const row_wise of order_obj.raw_data)
            {
                customer_ids.push(row_wise.customer_id)
                table_ids.push(row_wise.table_id)
                waiter_ids.push(row_wise.waiter_id)
                order_ids.push(row_wise.id)
            }
        }
        console.log("customerData== ", order_ids)

        //////////////////////
        var table_id_wise = {}
        const table_obj= await (new Common).get_data('table',{id:table_ids})
        console.log("table_obj== ", table_obj)
        if(table_obj.raw_data && table_obj.raw_data.length)
        {
            for(const row_wise of table_obj.raw_data)
            {
                table_id_wise[row_wise.id]  = row_wise             
            }
        }
        /////////////////////

        //////////////////////
        var waiter_id_wise = {}
        const waiter_obj= await (new Common).get_data('user',{id:waiter_ids})
        if(waiter_obj.raw_data && waiter_obj.raw_data.length)
        {
            for(const row_wise of waiter_obj.raw_data)
            {
                waiter_id_wise[row_wise.id]  = row_wise             
            }
        }
        console.log("waiter_obj== ", waiter_obj)
        /////////////////////


        const order_item_obj= await (new Common).get_data('order_item',{order_id:order_ids})
        console.log("order_item_obj== ", order_item_obj)
        var currency_icon   = await(new Common).currency_icon()

        var order_wise_prepared_time = {}
        if(order_item_obj.raw_data && order_item_obj.raw_data.length)
        {
            var order_id_wise = {}; var all_order_total = 0
            for(const row_wise of order_item_obj.raw_data)
            {
                row_wise.price_with_qty = currency_icon+''+(row_wise.subtotal * row_wise.quantity).toFixed(2)
                row_wise.subtotal = currency_icon+''+row_wise.subtotal
                row_wise.total = currency_icon+''+row_wise.total
                const item_obj     = await (new Common).get_data('item',{id:row_wise.item_id})
                if(item_obj.raw_data && item_obj.raw_data.length)
                {
                    row_wise.name = item_obj.raw_data[0].name
                    row_wise.max_prepared_time_item = item_obj.raw_data[0].prepared_time
                    row_wise.fulfillment_by = item_obj.raw_data[0].fulfillment_by
                }
                row_wise.modifier_group = row_wise.modifier_group ? JSON.parse(row_wise.modifier_group) : ''
                row_wise.extra_group    = row_wise.extra_group ? JSON.parse(row_wise.extra_group) : ''

                if(order_id_wise[row_wise.order_id]){
                order_id_wise[row_wise.order_id].push(row_wise)
                order_wise_prepared_time[row_wise.order_id].push(row_wise.max_prepared_time_item)
                }else{
                order_id_wise[row_wise.order_id] = [row_wise]
                order_wise_prepared_time[row_wise.order_id] = [row_wise.max_prepared_time_item]
                }
            }
       
            console.log("order_wise_prepared_time== ", order_wise_prepared_time['5'])
            if(order_obj.raw_data && order_obj.raw_data.length)
            {
                var payment_mode = app.payment_mode()
                var order_status_name = app.order_status()
                var orders_arr = order_obj.raw_data
                for(const row_wise of orders_arr)
                {
                    all_order_total += Number(row_wise.total)
                    var created_order = row_wise.createdAt
                    const date_time_mdfy = await (new Common).get_date_time(created_order)

                    row_wise.created_date = date_time_mdfy['date']
                    row_wise.created_time = date_time_mdfy['time']

                    row_wise.order_number   = row_wise.id
                    row_wise.total = currency_icon+''+row_wise.total
                    row_wise.subtotal = currency_icon+''+row_wise.subtotal
                    row_wise.payment_mode= payment_mode[row_wise.payment_mode]
                    row_wise.order_status_name = order_status_name[row_wise.status]
                    row_wise.table_name = table_id_wise[row_wise.table_id] ? table_id_wise[row_wise.table_id].name : ''
                    row_wise.max_prepared_time = Math.max(...order_wise_prepared_time[row_wise.id])
                    row_wise.waiter_name =  waiter_id_wise[row_wise.waiter_id] ? waiter_id_wise[row_wise.waiter_id].name : ''
                    row_wise.order_items =  order_id_wise[row_wise.id]
                }
            }
            var api_data = {}
            api_data['all_order_total_price']   = currency_icon+''+all_order_total.toFixed(2)
            api_data['orders']              =   orders_arr

            return res.json({status:true, message:'Order History.', type:'success', data:api_data})
        }

        return res.json({status:false, message:'There is no data.', type:'warning', data:null})
    }

    async calling_waiter(req, res){
       var validateObj = app.formValidate(req, ['table_id'])
       if(!validateObj.status)
       return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

       var body_parse = req.body
       const table_obj     = await (new Common).get_data('table',{id:body_parse.table_id})
       if(table_obj.raw_data && table_obj.raw_data.length){
        var table_id_wise   = table_obj['id_wise'][body_parse.table_id]
        var waiter_id       =  table_id_wise.waiter_id

        var where = {where:{id:waiter_id}}
        var update_data = {}
        update_data['calling_status'] = '1'

        db.user.update(update_data,where).then(async (result)=>{
            await (new Order).insert_noti({waiter_id, table_id:body_parse.table_id, type:'to_waiter'})
            return res.json({status:true, message:'Your waiter is coming.', type:'success', data:null}); 
        }).catch(err=>{
            return res.json({status:false, message:'Some thing went wrong', type:'error', data:err}) 
        })
       }

    }

    async insert_noti(args){
        var insert_data = {}
        if(args.waiter_id)
        insert_data['waiter_id'] = args.waiter_id 

        if(args.table_id)
        insert_data['table_id'] = args.table_id

        if(args.order_id)
        insert_data['order_id'] = args.order_id

        if(args.type)
        insert_data['type'] = args.type

        return await db.notification.create(insert_data).then(result=>{
        return result
        }).catch(err=>{
        return false
        });

    }

    async notification_check(req, res){
        var login_id = req.tokenValue.id
        const user_obj     = await (new Common).get_data('user',{enabled:'1', id:login_id, calling_status:'1'})
        if(user_obj.raw_data && user_obj.raw_data.length){
        return res.json({status:true, message:'You got it notification', type:'success', data:null});
        }else{
        return res.json({status:false, message:'There is no any new notification', type:'warning', data:null});
        }

    }

    async notifications(req, res){
        var login_id = req.tokenValue.id
        const noti_obj     = await (new Common).get_data('notification',{waiter_id:login_id, is_read:'0'})
        if(noti_obj.raw_data && noti_obj.raw_data.length)
        {
            var notifications = []; var order_id_arr =[];
            for(const row_wise of noti_obj.raw_data)
            {
                order_id_arr.push(row_wise.order_id)
            }

            const order_obj     = await (new Common).get_data('order',{id:order_id_arr})
            var currency_icon   = await(new Common).currency_icon()

            for(const row_wise of noti_obj.raw_data)
            {
                var row = {}
                row['notification_id'] = row_wise.id
                row['table_no'] = row_wise.table_id
                row['order_no'] = row_wise.order_id ? row_wise.order_id : ''
                row['max_time'] = 14
                row['amount']   = order_obj['id_wise'][row_wise.order_id] ? currency_icon+''+order_obj['id_wise'][row_wise.order_id].total : '';
                row['fulfillment_area'] = ['kitchen','bar'];
                row['waiter_calling_status'] = 'Calling';

                notifications.push(row)
            }
        return res.json({status:true, message:'Notification List', type:'success', data:notifications});
        }
        else
        {
           return res.json({status:false, message:'There is no notification', type:'warning', data:null});

        }

    }

    async notification_update(req, res){
       var validateObj = app.formValidate(req, ['notification_id'])
       if(!validateObj.status)
       return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var login_id = req.tokenValue.id
        var body_parse = req.body

        var where = {where:{waiter_id:login_id, id:body_parse.notification_id}}
        var update_data = {}
        update_data['is_read'] = '1'


        db.notification.update(update_data,where).then(result=>{
           return res.json({status:true, message:'Notification read successfully.', type:'success', data:null}); 
        }).catch(err=>{
           return res.json({status:false, message:'Some thing went wrong', type:'error', data:null}) 
        })
    }

    async notification_all_update(req, res){
        var login_id = req.tokenValue.id
        var body_parse = req.body

        var where = {where:{waiter_id:login_id}}
        var update_data = {}
        update_data['is_read'] = '1'


        db.notification.update(update_data,where).then(result=>{
           return res.json({status:true, message:'Notification read successfully.', type:'success', data:null}); 
        }).catch(err=>{
           return res.json({status:false, message:'Some thing went wrong', type:'error', data:null}) 
        })
    }

    async update_order_status(req, res){

       var order_status = app.order_status_constant()

       var body_parse = req.body

       var update_data = {}
       update_data['status'] = order_status[body_parse.Ready_to_deliver]

        var where = {where:{id:body_parse.order_id}} 
        db.order.update(update_data,where).then(async result=>{
            var where = {where:{order_id:body_parse.order_id}}
            db.order_item.update(update_data,where).then(async result=>{}).catch(err=>{})
            return res.json({status:true, message:'Order status updated successfully.', type:'success', data:null}); 
        }).catch(err=>{
           return res.json({status:false, message:'Some thing went wrong', type:'error', data:null})
           })
    }

    async edit_order_by_waiter(req, res){
        
    }

    async add_comment(req, res){
        
    }

}

module.exports = Order;
