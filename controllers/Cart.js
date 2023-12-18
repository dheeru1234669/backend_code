var db                  = require('../models');
var Common              = require('./Common')
var Customer_category   = require('./Customer_category')
var Waiter_order        = require('./Waiter_order')

const qs    = require('qs');

class Cart{

    async save_in_cart(req, res){
        var validateObj = app.formValidate(req, ['item_id', 'varient_id', 'cart_data', 'type'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body
        var type_call_api = body_parse.type == 'customer' ? 'customer_id' : 'waiter_id'
        
        var cart_val = JSON.parse(body_parse.cart_data)
        if(body_parse.modifier_data)
        cart_val.modifier_group = JSON.parse(body_parse.modifier_data)

        if(body_parse.extra_data)
        cart_val.extra_group = JSON.parse(body_parse.extra_data)

        var cart = {}
        cart[body_parse.item_id] = {}
        //cart[body_parse.item_id][body_parse.varient_id] = JSON.parse(body_parse.cart_data)
        cart[body_parse.item_id][body_parse.varient_id] = cart_val

        const cart_obj = await (new Common).get_data('cart', {[type_call_api]:req.tokenValue.id})

        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
            var db_cart = JSON.parse(cart_obj.raw_data[0].cart);
            var db_cart_append = JSON.parse(cart_obj.raw_data[0].cart);
            console.log("db_cart== ", db_cart)
            var cart_data = []; var updated_cart = {};
            var cnt = 0;

            const newDataFirstKey = body_parse.item_id;
            const newDataSecondKey = body_parse.varient_id

            const index = db_cart.findIndex(item => {
            const existingData = item[newDataFirstKey];
            return existingData && existingData[newDataSecondKey] !== undefined;
            });


            for (const cartItem of db_cart)
            {
                for (const itemKey in cartItem) 
                {
                    if (cartItem.hasOwnProperty(itemKey)) 
                    {
                        const variantData = cartItem[itemKey];
                        for (const variantKey in variantData) 
                        {
                            if (variantData.hasOwnProperty(variantKey)) 
                            {
                                var cartData = variantData[variantKey]                    
                                if(index === -1)
                                {
                                    db_cart_append.push(cart) 
                                }
                                else
                                {
                                    if(cart[itemKey] && cart[itemKey][variantKey])
                                    {
                                    
                                    db_cart_append[cnt][itemKey][variantKey].product_count += cart[itemKey][variantKey].product_count 
                                    db_cart_append[cnt][itemKey][variantKey].item_varient_price = db_cart_append[cnt][itemKey][variantKey].product_count * cartData.varient.price
                                    db_cart_append[cnt][itemKey][variantKey].modifier_group= body_parse.modifier_data
                                    db_cart_append[cnt][itemKey][variantKey].extra_group= body_parse.extra_data
                                    }
                                }
                                
                            }
                        }
                    }
                }
                cnt++
            }
            console.log("db_cart_append== ", db_cart_append) 
            var update_data = {}
            update_data['cart'] = JSON.stringify(db_cart_append)
            
            var where = {where:{[type_call_api]:req.tokenValue.id}}

            db.cart.update(update_data,where).then(result=>{
            return res.json({status:true, message:'success', type:'success', data:update_data});
            }).catch(err=>{
            return res.json({status:false, message:'error', type:'error', data:err});
            });
        }
        else
        {
            var insert_data = {}
            insert_data[type_call_api]  = req.tokenValue.id;
            insert_data['cart']         = JSON.stringify([cart])
        
            await db.cart.create(insert_data).then(result=>{
            return res.json({status:true, message:'success', type:'success', data:result});
            }).catch(err=>{
            return res.json({status:false, message:'error', type:'error', data:err});
            });
    
        }

    }

    async save_in_cart_by_waiter(req, res){
        var validateObj = app.formValidate(req, ['item_id', 'varient_id', 'cart_data'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body
        var cart_val = JSON.parse(body_parse.cart_data)
        if(body_parse.modifier_data)
        cart_val.modifier_group = JSON.parse(body_parse.modifier_data)

        if(body_parse.extra_data)
        cart_val.extra_group = JSON.parse(body_parse.extra_data)

        var cart = {}
        cart[body_parse.item_id] = {}
        cart[body_parse.item_id][body_parse.varient_id] = cart_val

        const cart_obj = await (new Common).get_data('cart', {waiter_id:req.tokenValue.id})

        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
            var db_cart = JSON.parse(cart_obj.raw_data[0].cart);
            var db_cart_append = JSON.parse(cart_obj.raw_data[0].cart);
            console.log("db_cart== ", db_cart)
            var cart_data = []; var updated_cart = {};
            var cnt = 0;

            const newDataFirstKey = body_parse.item_id;
            const newDataSecondKey = body_parse.varient_id

            const index = db_cart.findIndex(item => {
            const existingData = item[newDataFirstKey];
            return existingData && existingData[newDataSecondKey] !== undefined;
            });


            for (const cartItem of db_cart)
            {
                for (const itemKey in cartItem) 
                {
                    if (cartItem.hasOwnProperty(itemKey)) 
                    {
                        const variantData = cartItem[itemKey];
                        for (const variantKey in variantData) 
                        {
                            if (variantData.hasOwnProperty(variantKey)) 
                            {
                                var cartData = variantData[variantKey]                    
                                if(index === -1)
                                {
                                    db_cart_append.push(cart) 
                                }
                                else
                                {
                                    if(cart[itemKey] && cart[itemKey][variantKey])
                                    {
                                    
                                    db_cart_append[cnt][itemKey][variantKey].product_count += cart[itemKey][variantKey].product_count 
                                    db_cart_append[cnt][itemKey][variantKey].item_varient_price = db_cart_append[cnt][itemKey][variantKey].product_count * cartData.varient.price 
                                    }
                                }
                                
                            }
                        }
                    }
                }
                cnt++
            }
            
            var update_data = {}
            update_data['cart'] = JSON.stringify(db_cart_append)
            
            var where = {where:{waiter_id:req.tokenValue.id}}

            db.cart.update(update_data,where).then(result=>{
            return res.json({status:true, message:'success', type:'success', data:update_data});
            }).catch(err=>{
            return res.json({status:false, message:'error', type:'error', data:err});
            });
        }
        else
        {
            var insert_data = {}
            insert_data['waiter_id']= req.tokenValue.id;
            insert_data['cart']     = JSON.stringify([cart])
        
            await db.cart.create(insert_data).then(result=>{
            return res.json({status:true, message:'success', type:'success', data:result});
            }).catch(err=>{
            return res.json({status:false, message:'error', type:'error', data:err});
            });
    
        }

    }

    async cart_count(req, res){
        var validateObj = app.formValidate(req, ['type'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body
        var type_call_api = body_parse.type == 'customer' ? 'customer_id' : 'waiter_id'

        const cart_obj = await (new Common).get_data('cart', {[type_call_api]:req.tokenValue.id})
        console.log("cart_obj== ", cart_obj)

        var total_cart_amount = 0
        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
            var db_cart = JSON.parse(cart_obj.raw_data[0].cart);
            var item_ids        = db_cart.map(obj => Object.keys(obj)[0]);
            var item_full_detail     = await(new Cart).item_full_detail({item_ids})
            console.log("item_full_detail== ", item_full_detail)
            for (const cartItem of db_cart)
            {
                for (const itemKey in cartItem)
                {
                    if (cartItem.hasOwnProperty(itemKey))
                    {
                        const variantData = cartItem[itemKey];
                        for (const variantKey in variantData)
                        {
                                if (variantData.hasOwnProperty(variantKey))
                                {
                                    const cartData  = variantData[variantKey];
                                    var quantity    = cartData.product_count
                                    console.log("cartData== ", cartData)
                                    const modifier_group_option_array = cartData.modifier_group ? Object.values(cartData.modifier_group) : [];
                                    const extra_group_option_array = cartData.extra_group ? Object.values(cartData.extra_group) : [];
                                    //called function
                                    var modifier_price = await (new Cart).modifier_group_detail({options_ids:modifier_group_option_array})
                                    var prices = item_full_detail.item_varients['varient_wise_price'][itemKey][variantKey].price
                                    var extra_groupprice = await (new Cart).extra_group_price({options_ids:extra_group_option_array})

                                    prices = Number(prices) + Number(modifier_price['price']) + Number(extra_groupprice['price'])
                                    total_cart_amount += quantity * prices
                                }
                        }
                    }
                }
            }
    
            
            var currency_icon   = await(new Common).currency_icon()
            var message = Object.keys(db_cart).length+ ' Items in order '+ currency_icon +''+total_cart_amount
            return res.json({status:true, message, type:'success', data:db_cart});
        }
        else
        {
            return res.json({status:false, message:'There is no data.', type:'warning', data:null});
        }
    }

    async modifier_group_detail(args)
    {
        var option_ids = args.options_ids
        const cart_obj = await (new Common).get_data('modifier_option', {id:option_ids})
        var price = 0; var option_arr = [];
        if(cart_obj.raw_data && cart_obj.raw_data.length > 0)
        {
            var item_ids = [];
            for(const row_wise of cart_obj.raw_data)
            {
                if(row_wise.item_id)
                {
                    item_ids.push(row_wise.item_id)
                }
                if(row_wise.price)
                {
                    option_arr.push({name:row_wise.option, price:row_wise.price})           
                    price += Number(row_wise.price)
                }
            }
        }
        var ret_data = {}
        ret_data['price']       = price
        ret_data['option_arr']  = option_arr

        return ret_data

    }

    async extra_group_price(args)
    {
        var option_ids = args.options_ids
        console.log("option_ids== ", option_ids)
        const extra_group_obj = await (new Common).get_data('extra_group_option', {id:option_ids})

        var ret_data = {}
        var price = 0; var option_arr = []; var option_price = 0;
        if(extra_group_obj.raw_data && extra_group_obj.raw_data.length)
        {
           var item_ids = []; var item_with_varient = {}
           for(const row_wise of extra_group_obj.raw_data)
           {
                item_ids.push(row_wise.item_id)
                item_with_varient[row_wise.item_id] = row_wise.varient_id
           }
            var item_full_detail     = await(new Cart).item_full_detail({item_ids})
            console.log("item_full_detail== ", item_full_detail.item_detail['id_wise'])
            for(const row_wise of extra_group_obj.raw_data)
            {
                
                if(item_full_detail.item_varients.varient_wise_price[row_wise.item_id] && item_full_detail.item_varients.varient_wise_price[row_wise.item_id][row_wise.varient_id]){
                option_price = item_full_detail.item_varients.varient_wise_price[row_wise.item_id][row_wise.varient_id].price

                price += Number(item_full_detail.item_varients.varient_wise_price[row_wise.item_id][row_wise.varient_id].price)
                }

                option_arr.push({name:item_full_detail.item_detail['id_wise'][row_wise.item_id].name, price:option_price})
            }
        }
        ret_data['price']       = price
        ret_data['option_arr']  = option_arr

        return ret_data
    }

    async cart_count_by_waiter(req, res){
        const cart_obj = await (new Common).get_data('cart', {waiter_id:req.tokenValue.id})

        var total_cart_amount = 0
        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
            var db_cart = JSON.parse(cart_obj.raw_data[0].cart);
            for (const cartItem of db_cart)
            {
                for (const itemKey in cartItem)
                {
                    if (cartItem.hasOwnProperty(itemKey))
                    {
                        const variantData = cartItem[itemKey];
                        for (const variantKey in variantData)
                        {
                                if (variantData.hasOwnProperty(variantKey))
                                {
                                    const cartData = variantData[variantKey];
                                    total_cart_amount += cartData.item_varient_price 
                                }
                        }
                    }
                }
            }
    
            
            var currency_icon   = await(new Common).currency_icon()
            var message = Object.keys(db_cart).length+ ' Items in order '+ currency_icon +''+total_cart_amount
            return res.json({status:true, message, type:'success', data:db_cart});
        }
        else
        {
            return res.json({status:false, message:'There is no data.', type:'warning', data:null});
        }
    }

    async cart_detail(req, res, call_type=null, call_from=null){
        var cart_obj = []
        if(call_from == 'waiter')
        cart_obj = await (new Common).get_data('cart', {waiter_id:req.tokenValue.id})
        else
        cart_obj = await (new Common).get_data('cart', {customer_id:req.tokenValue.id})

        var cart_items = []; var quantity_wise_price = 0
        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
            var currency_icon   = await(new Common).currency_icon()
            var db_cart         = JSON.parse(cart_obj.raw_data[0].cart);
            var item_ids        = db_cart.map(obj => Object.keys(obj)[0]);
            var item_detail     = await (new Common).get_data('item', {id:item_ids})
            var item_images     = await(new Customer_category).item_images({only_visible_item_ids:item_ids})
            var item_varients   = await(new Customer_category).item_varients({only_visible_item_ids:item_ids})
         
            for(const cartItem of db_cart)
            {
                for(const itemKey in cartItem)
                {
                    if(cartItem.hasOwnProperty(itemKey))
                    {
                        const variantData = cartItem[itemKey];
                        for(const variantKey in variantData)
                        {
                            var row = {}
                            var cartData    = variantData[variantKey]
                            var quantity    = cartData.product_count
                            const modifier_group_option_array = cartData.modifier_group ? Object.values(cartData.modifier_group) : [];
                            const extra_group_option_array = cartData.extra_group ? Object.values(cartData.extra_group) : [];
                            var modifier_price = await (new Cart).modifier_group_detail({options_ids:modifier_group_option_array})

                            var item_price = item_varients['varient_wise_price'][itemKey][variantKey].price
                            var prices = item_varients['varient_wise_price'][itemKey][variantKey].price
                            var extra_groupprice = await (new Cart).extra_group_price({options_ids:extra_group_option_array})
                            prices = Number(prices) + Number(modifier_price['price']) + Number(extra_groupprice['price'])
                            quantity_wise_price += quantity * prices
                    
                            if(item_detail['id_wise'])
                            {
                                row['item_id']          = itemKey
                                row['varient_id']       = variantKey
                                row['name']             = item_detail['id_wise'][itemKey].name
                                row['modifier_group_option_id']   = modifier_group_option_array
                                row['modifier_group_option_arr']   = modifier_price['option_arr']
                                row['extra_group_option_id'] = extra_group_option_array
                                row['extra_group_option_arr'] = extra_groupprice['option_arr']
                                row['image']            = item_images['item_id_wise'][itemKey] && item_images['item_id_wise'][itemKey][0] ? item_images['item_id_wise'][itemKey][0].img_url : app.url+'/loc_images/location-profile.PNG'
                                row['qty_price']        = currency_icon+''+(quantity * item_price).toFixed(2)
                                row['price']            = currency_icon+''+ prices
                                row['price_no_symbol']  = prices
                                row['qty']              = quantity

                                cart_items.push(row)
                            }

                        }
                    }
                }
            }
            var ret_data = {}
            ret_data['cart_total_amount']       = currency_icon+''+quantity_wise_price.toFixed(2)
            ret_data['total_amount_no_symbol']  = quantity_wise_price.toFixed(2)
            ret_data['cart_item']               = cart_items

            if(call_type == 'inner')
            return ret_data

            return res.json({status:true, message:'Cart List', type:'success', data:ret_data});
        }
        return res.json({status:false, message:'There is no data.', type:'warning', data:null});

    }

    async cart_detail_by_waiter(req, res, call_type=null){
        var waiter_id = req.tokenValue.id
        console.log("wailter_id== ", waiter_id)
        const cart_obj = await (new Common).get_data('cart', {waiter_id:req.tokenValue.id})

        var cart_items = []; var quantity_wise_price = 0
        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
            var currency_icon   = await(new Common).currency_icon()
            var db_cart         = JSON.parse(cart_obj.raw_data[0].cart);
            var item_ids        = db_cart.map(obj => Object.keys(obj)[0]);
            var item_detail     = await (new Common).get_data('item', {id:item_ids})
            var item_images     = await(new Customer_category).item_images({only_visible_item_ids:item_ids})
            var item_varients   = await(new Customer_category).item_varients({only_visible_item_ids:item_ids})
         
            for(const cartItem of db_cart)
            {
                for(const itemKey in cartItem)
                {
                    if(cartItem.hasOwnProperty(itemKey))
                    {
                        const variantData = cartItem[itemKey];
                        for(const variantKey in variantData)
                        {
                            var row = {}
                            var cartData    = variantData[variantKey]
                            var quantity    = cartData.product_count
                            const modifier_group_option_array = cartData.modifier_group ? Object.values(cartData.modifier_group) : [];
                            const extra_group_option_array = cartData.extra_group ? Object.values(cartData.extra_group) : [];
                            var modifier_price = await (new Cart).modifier_group_detail({options_ids:modifier_group_option_array})
                            var item_price = item_varients['varient_wise_price'][itemKey][variantKey].price
                            var prices = item_varients['varient_wise_price'][itemKey][variantKey].price
                            var extra_groupprice = await (new Cart).extra_group_price({options_ids:extra_group_option_array})

                            prices = Number(prices) + Number(modifier_price['price']) + Number(extra_groupprice['price'])
                            quantity_wise_price += quantity * prices
                    
                            if(item_detail['id_wise'])
                            {
                                row['item_id']          = itemKey
                                row['varient_id']       = variantKey
                                row['name']             = item_detail['id_wise'][itemKey].name
                                row['modifier_group_option_id']   = modifier_group_option_array
                                row['modifier_group_option_arr']   = modifier_price['option_arr']
                                row['extra_group_option_id'] = extra_group_option_array
                                row['extra_group_option_arr'] = extra_groupprice['option_arr'] ? extra_groupprice['option_arr'] : []

                                row['image']            = item_images['item_id_wise'][itemKey] ? item_images['item_id_wise'][itemKey][0].img_url : app.url+'/loc_images/location-profile.PNG'
                                row['qty_price']        = currency_icon+''+(quantity * prices).toFixed(2)
                                row['price']            = currency_icon+''+ prices
                                row['price_no_symbol']  = prices
                                row['qty']              = quantity

                                cart_items.push(row)
                            }

                        }
                    }
                }
            }
            const assigned_table_ids = await (new Waiter_order).assigned_table_ids({login_id:waiter_id})

            var ret_data = {}
            ret_data['cart_total_amount']       = currency_icon+''+quantity_wise_price.toFixed(2)
            ret_data['total_amount_no_symbol']  = quantity_wise_price.toFixed(2)
            ret_data['cart_item']               = cart_items
            ret_data['waiter_assigned_table']   = assigned_table_ids.table_combo
            

            if(call_type == 'inner')
            return ret_data

            return res.json({status:true, message:'Cart List', type:'success', data:ret_data});
        }
        return res.json({status:false, message:'There is no data.', type:'warning', data:null});

    }

    async cart_update_qty(req, res){
        var validateObj = app.formValidate(req, ['item_id', 'varient_id', 'qty_type'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body
        const cart_obj = await (new Common).get_data('cart', {customer_id:req.tokenValue.id})

        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
           var db_cart = JSON.parse(cart_obj.raw_data[0].cart);
            const newDataFirstKey = body_parse.item_id;
            const newDataSecondKey = body_parse.varient_id

            const index = db_cart.findIndex(item => {
            const existingData = item[newDataFirstKey];
            return existingData && existingData[newDataSecondKey] !== undefined;
            });

            if(body_parse.qty_type == 'increase') 
            db_cart[index][newDataFirstKey][newDataSecondKey].product_count++
            else if(body_parse.qty_type == 'decrease' && db_cart[index][newDataFirstKey][newDataSecondKey].product_count > 1)
            db_cart[index][newDataFirstKey][newDataSecondKey].product_count--

            var update_data = {}
            update_data['cart'] = JSON.stringify(db_cart)
            
            var where = {where:{customer_id:req.tokenValue.id}}

            db.cart.update(update_data,where).then(result=>{
            return res.json({status:true, message:'success', type:'success', data:update_data});
            }).catch(err=>{
            return res.json({status:false, message:'error', type:'error', data:err});
            });

        }
    }

    async cart_update_qty_by_waiter(req, res){
        var validateObj = app.formValidate(req, ['item_id', 'varient_id', 'qty_type'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body
        const cart_obj = await (new Common).get_data('cart', {waiter_id:req.tokenValue.id})

        if(cart_obj.raw_data && cart_obj.raw_data.length)
        {
           var db_cart = JSON.parse(cart_obj.raw_data[0].cart);
            const newDataFirstKey = body_parse.item_id;
            const newDataSecondKey = body_parse.varient_id

            const index = db_cart.findIndex(item => {
            const existingData = item[newDataFirstKey];
            return existingData && existingData[newDataSecondKey] !== undefined;
            });

            if(body_parse.qty_type == 'increase') 
            db_cart[index][newDataFirstKey][newDataSecondKey].product_count++
            else if(body_parse.qty_type == 'decrease' && db_cart[index][newDataFirstKey][newDataSecondKey].product_count > 1)
            db_cart[index][newDataFirstKey][newDataSecondKey].product_count--

            var update_data = {}
            update_data['cart'] = JSON.stringify(db_cart)
            
            var where = {where:{waiter_id:req.tokenValue.id}}

            db.cart.update(update_data,where).then(result=>{
            return res.json({status:true, message:'success', type:'success', data:update_data});
            }).catch(err=>{
            return res.json({status:false, message:'error', type:'error', data:err});
            });

        }
    }

    async item_full_detail(args){ //ITEM FULL DETAIL
    var item_ids = args.item_ids
    var item_detail     = await (new Common).get_data('item', {id:item_ids})
    var item_images     = await(new Customer_category).item_images({only_visible_item_ids:item_ids})
    var item_varients   = await(new Customer_category).item_varients({only_visible_item_ids:item_ids})      

    var ret_data = {}
    ret_data['item_detail']     = item_detail
    ret_data['item_images']     = item_images
    ret_data['item_varients']   = item_varients

    return ret_data
    }
}

module.exports = Cart;
