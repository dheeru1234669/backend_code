var db          = require('../models');
var Common      = require('./Common')
var Customer_category      = require('./Customer_category')

class Waiter_order{

    async list_orders(req, res){
        const assigned_table_ids = await (new Waiter_order).assigned_table_ids({login_id:req.tokenValue.id})      
        const order_list = await (new Waiter_order).order_list_func({assigned_table_ids})       

        if(order_list)
        return res.json({status:true, message:'order list', type:'success', data:order_list})

        return res.json({status:false, message:'There is no order', type:'warning', data:null});

        
        
    }

    async login_dtl(req, res){
        const login_obj = await (new Common).get_data('user', {id:req.tokenValue.id})
        var login_dtl = {}
        if(login_obj.raw_data && login_obj.raw_data.length)
        login_dtl = login_obj.raw_data[0]

        return login_dtl
    }

    async assigned_table_ids(args){
        const table_obj = await (new Common).get_data('table', {enabled:'1'})
        var table_ids = []; var table_combo = []
        if(table_obj.raw_data && table_obj.raw_data.length)
        {
            for(const row_wise of table_obj.raw_data)
            {
                //table_ids = Object.keys(table_obj.id_wise);
                if(row_wise.waiter_id == args.login_id)
                {
                    table_ids.push(row_wise.id)
                    table_combo.push({name:row_wise.name, id:row_wise.id})
                }
            }
        }
       
        var ret_data = {}
        ret_data['table_ids']   = table_ids
        ret_data['table_combo'] = table_combo
        ret_data['id_wise']     = table_obj.id_wise

        return ret_data
    }

    async order_list_func(args){
        var table_ids   = args.assigned_table_ids.table_ids
        var id_wise     = args.assigned_table_ids.id_wise
        console.log("id_wise=== ", id_wise)

        const order_obj = await (new Common).get_data('order', {status:1})
        var my = []; var all = [];
        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            var waiter_ids = {}
            for(const row_wise of order_obj.raw_data)
            {
                waiter_ids[row_wise.waiter_id] = 1
            }

            const user_obj      = await (new Common).get_data('user', {id:Object.keys(waiter_ids)})
            
            for(const row_wise of order_obj.raw_data)
            {
                const date_time_mdfy = await (new Common).get_date_time(row_wise.createdAt)
                row_wise.table_no   = row_wise.table_id
                row_wise.table_name = id_wise[row_wise.table_id] ? id_wise[row_wise.table_id].name : ''
                row_wise.order_no   = row_wise.order_uid
                row_wise.amount     = 'R'+row_wise.total
                row_wise.created    = date_time_mdfy['except_sec']
                row_wise.waiter_name= user_obj.id_wise[row_wise.waiter_id] ? user_obj.id_wise[row_wise.waiter_id].name : ''
                if(table_ids.includes(row_wise.table_id))
                {
                    my.push(row_wise)
                }
                all.push(row_wise)
            }
        }
        var ret_data = {}
        ret_data['my'] = my
        ret_data['all']= all

        return ret_data
    }

    async order_detail(req, res){
        var validateObj = app.formValidate(req, ['order_uid']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body

        const order_obj = await (new Common).get_data('order', {order_uid:body_parse.order_uid})
        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            var currency_icon   = await(new Common).currency_icon()
            var payment_mode    = app.payment_mode()

            var order_obj_row = order_obj.raw_data[0]

            var order_ids = Object.keys(order_obj.id_wise); 
            const order_item_obj = await (new Common).get_data('order_item', {order_id:order_ids})    
            const date_time_mdfy = await (new Common).get_date_time(order_obj_row.createdAt)
            
            var order_data = {}
            order_data['table_no']  = order_obj_row.table_id
            order_data['order_uid'] = order_obj_row.order_uid
            order_data['total']     = currency_icon+''+order_obj_row.total
            order_data['created_date'] = date_time_mdfy['date']
            order_data['created_time'] = date_time_mdfy['time']
            order_data['payment_mode']= payment_mode[order_obj_row.payment_mode]

            var items = []
            if(order_item_obj.raw_data && order_item_obj.raw_data.length)
            {
                for(const row_wise of order_item_obj.raw_data)
                {
                    row_wise.name = 'DUMMY'
                    items.push(row_wise)
                }
            }
            var api_data = {}
            api_data['order_summry'] = order_data;
            api_data['items'] = items;

            return res.json({status:true, message:'order list', type:'success', data:api_data})
        }
        else
        {
            return res.json({status:false, message:'There is no order', type:'warning', data:null});
        }
    }

    async order_detail_tbl_wise(req, res){
        var validateObj = app.formValidate(req, ['table_no']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        var order_obj = {}
        if(body_parse.order_no)
        order_obj = await (new Common).get_data('order', {table_id:body_parse.table_no, order_uid:body_parse.order_no})
        else
        order_obj = await (new Common).get_data('order', {table_id:body_parse.table_no})

        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            var table_uid_wise = {}
            var currency_icon   = await(new Common).currency_icon()
            var payment_mode    = app.payment_mode()
            var all_orders_total_price = 0; var order_max_time = {}
            for(const row_wise of order_obj.raw_data)
            {
                const date_time_mdfy= await (new Common).get_date_time(row_wise.createdAt)
                const tbl_obj       = await (new Common).get_data('table', {id:row_wise.table_id})

                var order_data = {}
                order_data['table_no']  = row_wise.table_id
                order_data['table_name']= tbl_obj.id_wise[row_wise.table_id] ? tbl_obj.id_wise[row_wise.table_id].name : ''
                order_data['order_uid'] = row_wise.order_uid
                order_data['total']     = currency_icon+''+row_wise.total
                order_data['created_date']  = date_time_mdfy['date']
                order_data['created_time']  = date_time_mdfy['time']
                order_data['payment_mode']  = payment_mode[row_wise.payment_mode]
                order_data['comment']       =   row_wise.comment

                all_orders_total_price += Number(row_wise.total)
                const order_item_obj = await (new Common).get_data('order_item', {order_id:row_wise.id})
                var items = []
                if(order_item_obj.raw_data && order_item_obj.raw_data.length)
                {
                    for(const inner_row_wise of order_item_obj.raw_data)
                    {
                        console.log("inner_row_wise== ", inner_row_wise.modifier_group)
                        const item_obj = await (new Common).get_data('item', {id:inner_row_wise.item_id})
                        var item_images     = await(new Customer_category).item_images({only_visible_item_ids:inner_row_wise.item_id})
                        if(order_max_time[inner_row_wise.order_id])
                        order_max_time[inner_row_wise.order_id].push(item_obj.id_wise[inner_row_wise.item_id].prepared_time)
                        else
                        order_max_time[inner_row_wise.order_id] = [item_obj.id_wise[inner_row_wise.item_id].prepared_time]

                        inner_row_wise.item_uid = item_obj.id_wise[inner_row_wise.item_id] ? item_obj.id_wise[inner_row_wise.item_id].item_uid : ''
                        inner_row_wise.image = item_images['item_id_wise'][inner_row_wise.item_id] ? item_images['item_id_wise'][inner_row_wise.item_id][0].img_url : app.url+'/loc_images/location-profile.PNG'
                        inner_row_wise.name = item_obj.id_wise[inner_row_wise.item_id] ? item_obj.id_wise[inner_row_wise.item_id].name : ''
                        inner_row_wise.unit_price = currency_icon+''+inner_row_wise.subtotal
                        inner_row_wise.total_price = currency_icon+''+(inner_row_wise.quantity * inner_row_wise.subtotal)
                        inner_row_wise.modifier_group = inner_row_wise.modifier_group ? JSON.parse(inner_row_wise.modifier_group) : []
                        inner_row_wise.extra_group = inner_row_wise.extra_group ? JSON.parse(inner_row_wise.extra_group) : []


                        items.push(inner_row_wise)
                    }
                }

                console.log("order_max_time=== ", order_max_time)
                if(!table_uid_wise[row_wise.table_id]){
                table_uid_wise[row_wise.table_id] = {};
                }
                if(!table_uid_wise[row_wise.table_id][row_wise.order_uid]) {
                table_uid_wise[row_wise.table_id][row_wise.order_uid] = [];
                }
                var api_data = {}
                api_data['order_summary'] = order_data;
                api_data['items'] = items;

                table_uid_wise[row_wise.table_id][row_wise.order_uid] = api_data;

            }
            var orders = [];
            if(body_parse.order_no){
                orders = [table_uid_wise[body_parse.table_no][body_parse.order_no]]
            }else{
                var orders_keys = table_uid_wise[body_parse.table_no]
                for(const orderId in orders_keys){
                    if(orders_keys.hasOwnProperty(orderId)){
                        orders.push(orders_keys[orderId]);
                    }
                }
            }

            var order_data = {}
            order_data['total_order_price'] = currency_icon+''+all_orders_total_price
            order_data['orders'] = orders

            return res.json({status:true, message:'order list', type:'success', data:order_data}) 
        }
        return res.json({status:false, message:'There is no order', type:'warning', data:null});
    }

    async order_cancel(req, res){
        var validateObj = app.formValidate(req, ['order_no']);    
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body

        const order_obj = await (new Common).get_data('order', {order_uid:body_parse.order_no})
        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            if(order_obj.raw_data[0].status !=1)
            {
                return res.json({status:false, message:'Order not cancelled.', type:'warning', data:null});       
            }
        }

        var update_data = {}
        update_data['status'] = '2'

        var where = {where:{order_uid:body_parse.order_no}}
        db.order.update(update_data,where).then(result=>{
        return res.json({status:true, message:'Order Successfully Cancelled', type:'success', data:null});
        }).catch(err=>{
        return res.json({status:false, message:'Some thing went wrong', type:'warning', data:null});
        })
    }

    async order_update_qty(req, res){
        var body_parse = req.body
        if(body_parse.qty_type)
        {
            var validateObj = app.formValidate(req, ['order_id','order_item_uid']);
            if(!validateObj.status)
            return res.json({status:false, message:validateObj.msg, type:'warning', data:null});
        }

        var body_parse = req.body
        console.log("body_parse== ", body_parse)
        if(!body_parse.qty_type)
        {
            var comment_obj = await (new Waiter_order).order_update_comment({body_parse})
            if(comment_obj)
            return res.json({status:true, message:'Comment Updated', type:'success', data:null});    
            else
            return res.json({status:false, message:'Some Thing went wrong', type:'warning', data:null});
        }

        const order_obj = await (new Common).get_data('order_item', {order_id:body_parse.order_id, order_item_uid:body_parse.order_item_uid})
        var update_qty = {}; var order_item_total = 0; 
        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            for(const row_wise of order_obj.raw_data)
            {
                var qty = row_wise.quantity
                if(row_wise.order_item_uid == body_parse.order_item_uid)
                {
                    if(body_parse.qty_type == 'increase'){
                        qty +=1
                        update_qty[row_wise.order_item_uid] = qty
                        order_item_total += qty * row_wise.subtotal
                    }else if(body_parse.qty_type == 'decrease' && qty >= 1){ 
                        if(qty > 1)
                        qty -=1

                        update_qty[row_wise.order_item_uid] = qty 
                        order_item_total += qty * row_wise.subtotal
                    }
                }
                else
                {
                    order_item_total += Number(row_wise.subtotal)
                }
            }
            
        }

        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            /*var qty_num = 1; var order_item_id = ''
            Object.entries(order_obj.id_wise).forEach(([key, value]) => {
                order_item_id = value.id
                if(body_parse.qty_type == 'increase'){
                qty_num = value.quantity +=1
                }else if(body_parse.qty_type == 'decrease' && value.quantity > 1){
                qty_num = value.quantity -=1
                }
            })*/
            

            console.log("Waiter_order309=", update_qty, update_qty[body_parse.order_item_uid], order_item_total)
            var update_data = {}
            if(body_parse.qty_type)
            update_data['quantity'] = update_qty[body_parse.order_item_uid]

            var where = {where:{order_item_uid:body_parse.order_item_uid}}
            db.order_item.update(update_data,where).then(result=>{
                var update_data_order = {}
                update_data_order['subtotal'] = order_item_total
                update_data_order['total'] = order_item_total

                var where_order = {where:{id:order_obj.raw_data[0].id}}
                db.order.update(update_data_order,where_order).then(result=>{}).catch(err=>{console.log("err111==", err)})
            return res.json({status:true, message:'success', type:'success', data:update_data});
            }).catch(err=>{
            console.log("err= ", err)
            return res.json({status:false, message:'error', type:'error', data:err});
            });

        }
    }


    async order_update_comment(args){
        var body_parse = args.body_parse
        if(!body_parse.comment || !body_parse.order_uid)
        return false

        var update_data = {}
        update_data['comment'] = body_parse.comment

        var where = {where:{order_uid:body_parse.order_uid}}
        return db.order.update(update_data,where).then(result=>{
        return true
        }).catch(err=>{
        return false    
        });

    }

    async update_order_status(req, res){
        var validateObj = app.formValidate(req, ['order_uid', 'status']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body
        app.order_status_constant()
        var order_status_constant = app.order_status_constant()
        if(order_status_constant[body_parse.status])
        {
            var update_data = {}
            update_data['status'] = order_status_constant[body_parse.status]

            var where = {where:{order_uid:body_parse.order_uid}}
            db.order.update(update_data,where).then(result=>{
            return res.json({status:true, message:'Order status updated successfully.', type:'success', data:null}) 
            }).catch(err=>{
            return res.json({status:false, message:'Some thing went wrong', type:'warning', data:null})
            });
        }
    }

    async order_by_id(args){
        var order_id = args.order_id
        const order_obj = await (new Common).get_data('order', {id:order_id})
        if(order_obj.raw_data && order_obj.raw_data.length)
        {
            
        }

    }

}
module.exports = Waiter_order;
