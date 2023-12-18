var db = require('../config/db.config.js')
var Common      = require('./Common')
var Item        = require('./Item')
var Modifier    = require('./Modifier')
var Extras_group= require('./Extras_group')

class Customer_category{

    async list_category(req, res){
        var validateObj = app.formValidate(req, ['parent_cat_id'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body;
        const cate_obj = await (new Common).get_data_with_or('category',{id:body_parse.parent_cat_id, parent:body_parse.parent_cat_id}, '1')
        if(cate_obj.raw_data && cate_obj.raw_data.length)
        {
            var child_data = []; var click_id = '';
            for(const row_wise of cate_obj.raw_data)
            {
                row_wise.image_mdfy     = row_wise.image ? app.url+'/cat_images/'+row_wise.image : ''

                var row = {}
                row.id          = row_wise.id
                row.cat_uid     = row_wise.cat_uid
                row.name        = row_wise.name
                row.image       = row_wise.image
                row.header_type = row_wise.header_type
                row.image_mdfy  = row_wise.image_mdfy
                row.is_add_item = row_wise.is_add_item

                

                if(row_wise.id == body_parse.parent_cat_id)
                click_id = row
                else
                child_data.push(row)    
            }
            var data = {}
            data['click_id'] = click_id
            data['category'] = child_data

            return res.json({status:true, message:'Category List', type:'success', data}) 
        }
        else
        {
           return res.json({status:false, message:'There is no data.', type:'error', data:null}) 
        }

   }

    async items_by_cat(req, res){
        if(req.body.item != 'all')
        {
            var validateObj = app.formValidate(req, ['cat_id'])
            if(!validateObj.status)
            return res.status(400).json({status:false, message:validateObj.msg, data:null})
        }

        var body_parse = req.body
        var item_obj = {}

        if(body_parse.item && body_parse.item == 'all'){
        item_obj    = await(new Item).item_search_by_name({body_parse})
        item_obj['raw_data'] = item_obj
        }else{
        item_obj = await (new Common).get_data('item', {enabled:'1', cat_id:body_parse.cat_id})
        }

        if(item_obj)
        {
            var item_ids = []; var item_dtl = {};
            for(const row_wise of item_obj.raw_data)
            {
                item_dtl[row_wise.id] = row_wise
                item_ids.push(row_wise.id)       
            }

            var item_wise_visibility= await(new Customer_category).item_visibility({item_ids})
            const current_time_info = await(new Common).get_current_time()

            console.log("current_time_info== ", current_time_info)
           
            var item_list = []; var only_visible_item_ids = [];
            var final_item_list = [];
            for(const row_wise of item_obj.raw_data)
            {
                //console.log()
                var row = {}
                //show_hide_item == 1 means disable item
                //some condition test pending
                var start_time = ''; var end_time = ''; var day_id = '';
                if(item_wise_visibility.item_id_wise[row_wise.id] && current_time_info.day_index == day_id)
                {
                    start_time  = item_wise_visibility.item_id_wise[row_wise.id].start_time
                    end_time    = item_wise_visibility.item_id_wise[row_wise.id].end_time
                    day_id    = item_wise_visibility.item_id_wise[row_wise.id].day_id  
                

                    if(item_wise_visibility.item_id_wise[row_wise.id].show_hide_item == 1)
                    {

                        if(current_time_info.day_index == day_id && current_time_info.hour >= start_time && current_time_info.hour <= end_time && current_time_info.minutes >= 0 && current_time_info.minutes <= 59)
                        {
                            continue
                        }
                    }

                    if(item_wise_visibility.item_id_wise[row_wise.id] && item_wise_visibility.item_id_wise[row_wise.id].show_hide_item == 2)
                    {
                        if(current_time_info.day_index == day_id && current_time_info.hour >= start_time && current_time_info.hour <= end_time && current_time_info.minutes >= 0 && current_time_info.minutes <= 59)
                        {
                            row['id'] = row_wise.id
                            row['name'] = row_wise.name
                        }
                    }
                }
                else
                {
                    row['id'] = row_wise.id
                    row['name'] = row_wise.name
                
                }
                
                if(Object.keys(row).length)
                {
                    item_list.push(row)
                    only_visible_item_ids.push(row.id)
                }

            }
            var currency_icon   = await(new Common).currency_icon()

            var item_varients   = await(new Customer_category).item_varients({only_visible_item_ids})
            var item_images     = await(new Customer_category).item_images({only_visible_item_ids})
            var preference_tag  = await(new Item).get_item_preference_tag({req, res, body_parse, item_info:{id:only_visible_item_ids}})
            for(const item_id of only_visible_item_ids)
            {
                var size_str = []; var price_arr = [];
                if(item_varients['item_id_wise'][item_id].length > 1)
                {
                    size_str = 'Choose between ';
                    var cnt=0;
                    for(const row_wise of item_varients['item_id_wise'][item_id])
                    {
                        cnt++;
                        var and_str = item_varients['item_id_wise'][item_id].length == cnt ? '' : ' and '
                        size_str += row_wise.size+and_str;
                        price_arr.push(row_wise.price)
                    }
                }
                else
                {
                    if(item_dtl[item_id])
                    size_str = item_dtl[item_id].short_desc;
                    price_arr.push(item_varients['item_id_wise'][item_id][0].price)
                }
                const minPrice = Math.min(...price_arr);
                var image = item_images['item_id_wise'][item_id] && item_images['item_id_wise'][item_id][0] ? item_images['item_id_wise'][item_id][0].img_url : app.url+'/loc_images/location-profile.PNG'

                var item_pref_tags = preference_tag['item_wise_pref_tag'][item_id]
                if(item_pref_tags != undefined)
                {
                    for(var row_pref_tag of item_pref_tags)
                    {
                        row_pref_tag.preference_tag_name = preference_tag['pref_tag'][row_pref_tag.preference_tag_id].name
                    }
                }

                var str=size_str.split(' ');
                var lastword=str.pop();

                var row = {}
                row['id']       = item_dtl[item_id].id
                row['item_uid'] = item_dtl[item_id].item_uid
                row['name']     = item_dtl[item_id].name
                row['short_desc'] = size_str
                row['price']    = price_arr.length > 1 ? 'From '+currency_icon+''+minPrice : currency_icon+''+minPrice
                row['image']    = image
                row['preference_tag'] = item_pref_tags

                final_item_list.push(row)
            }
            const cate_obj = await (new Common).get_data('category', {id:body_parse.cat_id})            
            var ret_data = {}
            ret_data['cat'] = cate_obj.raw_data && cate_obj.raw_data.length ? cate_obj.raw_data[0].name : ''
            ret_data['item_list'] = final_item_list
            
            return res.json({status:true, message:'Item List', type:'success', data:ret_data}) 
        }
        return res.json({status:false, message:'There is no data.', type:'error', data:null})
    }
    
    async item_visibility(args){
        const item_visibility_obj = await (new Common).get_data('item_visibility',{item_id:args.item_ids})
        var item_id_wise = {}
        if(item_visibility_obj.raw_data.length)
        {
            for(const row_wise of item_visibility_obj.raw_data)
            {
                item_id_wise[row_wise.item_id] = row_wise
            }
            
        }
        var ret_data = {}
        ret_data['item_id_wise'] = item_id_wise

        return ret_data
    }

    async item_varients(args){
        var currency_icon   = await(new Common).currency_icon()
        const item_varients_obj = await (new Common).get_data('item_varient',{item_id:args.only_visible_item_ids});
        var item_id_wise = {}; var varient_wise_price = {};
        if(item_varients_obj.raw_data)
        {
            var current_time   = await(new Common).get_current_time()
            var price_day_exception = await (new Customer_category).price_day_exceptions({item_id:args.only_visible_item_ids, current_time})
            var price_time_exception = await (new Customer_category).price_time_exceptions({item_id:args.only_visible_item_ids, current_time})
            console.log("price_time_exception== ", price_time_exception)
            for(const row_wise of item_varients_obj.raw_data)
            {
                row_wise.price = price_day_exception['day_wise_price'] && price_day_exception['day_wise_price'][current_time.day_index] && price_day_exception['day_wise_price'][current_time.day_index][row_wise.item_id] && price_day_exception['day_wise_price'][current_time.day_index][row_wise.item_id][row_wise.id]? price_day_exception['day_wise_price'][current_time.day_index][row_wise.item_id][row_wise.id].price : row_wise.price

                row_wise.price_with_symbol = currency_icon+''+row_wise.price

                if(item_id_wise[row_wise.item_id])
                item_id_wise[row_wise.item_id].push(row_wise)
                else
                item_id_wise[row_wise.item_id] = [row_wise]

                if(!varient_wise_price[row_wise.item_id])
                varient_wise_price[row_wise.item_id] = {}

                varient_wise_price[row_wise.item_id][row_wise.id]= row_wise
            }
        }

        var ret_data = {}
        ret_data['item_id_wise']        = item_id_wise
        ret_data['varient_wise_price']  = varient_wise_price

        return ret_data
    
    }

    async price_day_exceptions(args){
        var current_time = args.current_time
        const day_wise_price = await (new Common).get_data('item_price_day_exception',{item_id:args.item_id});
        var day_wise_price_obj = {}
        if(day_wise_price.raw_data && day_wise_price.raw_data.length)
        {
            for(const row_wise of day_wise_price.raw_data)
            {
                if(current_time.day_index == row_wise.day)
                {
                    if (!day_wise_price_obj[current_time.day_index]) {
                    day_wise_price_obj[current_time.day_index] = {};
                    }
                    if (!day_wise_price_obj[current_time.day_index][row_wise.item_id]) {
                    day_wise_price_obj[current_time.day_index][row_wise.item_id] = {};
                    }

                    day_wise_price_obj[current_time.day_index][row_wise.item_id][row_wise.varient_id] = row_wise              
                }
            }
        }
        var ret_data = {}
        ret_data['day_wise_price'] = day_wise_price_obj

        return ret_data
    }

    async price_time_exceptions(args){
        var current_time = args.current_time
        const time_wise_price = await (new Common).get_data('item_price_time_exceptions',{item_id:args.item_id});
        console.log("timedf=== ", args)
        var time_wise_price_obj = {}
        if(time_wise_price.raw_data && time_wise_price.raw_data.length)
        {
            for(const row_wise of time_wise_price.raw_data)
            {
                console.log("time=== ", row_wise)
                if(current_time.day_index == row_wise.day && current_time.hour >= row_wise.start_time && current_time.hour <= row_wise.end_time && current_time.minutes >= 0 && current_time.minutes <= 59)
                {
                    if (!time_wise_price_obj[current_time.day_index]) {
                    time_wise_price_obj[current_time.day_index] = {};
                    }
                    if (!time_wise_price_obj[current_time.day_index][row_wise.item_id]) {
                    time_wise_price_obj[current_time.day_index][row_wise.item_id] = {};
                    }
                        
                    time_wise_price_obj[current_time.day_index][row_wise.item_id][row_wise.varient_id] = row_wise              
                }
            }
        }
        var ret_data = {}
        ret_data['time_wise_price'] = time_wise_price_obj

        return ret_data
    }

    async item_images(args){
        const item_images_obj = await (new Common).get_data('item_image',{item_id:args.only_visible_item_ids});
        var item_id_wise = {}
        if(item_images_obj.raw_data)
        {
            for(const row_wise of item_images_obj.raw_data)
            {
                row_wise.img_url = app.url+'/item_images/'+row_wise.name

                if(item_id_wise[row_wise.item_id])
                item_id_wise[row_wise.item_id].push(row_wise)
                else
                item_id_wise[row_wise.item_id] = [row_wise]
            }
        }
        var ret_data = {}
        ret_data['item_id_wise'] = item_id_wise

        return ret_data
    }

    async item_dtl_by_id(req, res){
        var validateObj = app.formValidate(req, ['item_uid'])
        if(!validateObj.status)
        return res.status(400).json({status:false, message:validateObj.msg, data:null})

        var body_parse = req.body
        const item_obj = await (new Common).get_data('item',{item_uid:body_parse.item_uid}); 

        var data = {}; var item_modifier_group = []; var item_extra_group = [];
        if(item_obj.raw_data)
        {
            var item_data   = item_obj.raw_data[0]
            const cate_obj  = await (new Common).get_data('category', {id:item_data.cat_id})
            var images      = await(new Customer_category).item_images({only_visible_item_ids:item_data.id})
            var tags        = await(new Item).get_item_tag({req, res, body_parse, item_info:item_data})
            var preference_tags = await(new Item).get_item_preference_tag({req, res, body_parse, item_info:item_data})
            
            var item_varients   = await(new Customer_category).item_varients({only_visible_item_ids:item_data.id})
            var item_modifier_group_obj = await(new Item).get_modifier_group({body_parse, item_info:item_data})
            console.log("modifier_group_ids== ", item_modifier_group_obj.modifier_group_ids)
            if(item_modifier_group_obj.modifier_group_ids.length > 0)
            item_modifier_group   = await(new Modifier).list_modifier_group(req, res, {from_js:'customer_category', modifier_group_id:item_modifier_group_obj.modifier_group_ids})

            var item_extra_group_obj = await(new Item).get_extras_group({body_parse, item_info:item_data})
            if(item_extra_group_obj.extra_group_ids.length > 0)
            item_extra_group    = await(new Extras_group).list_extras_group(req, res, {from_js:'customer_category', id:item_extra_group_obj.extra_group_ids})



            item_data.imges             = images['item_id_wise'][item_data.id]
            item_data.tag               = Object.values(tags.tag);
            item_data.preference_tag_dtl_by_id = preference_tags['pref_tag']
            item_data.preference_tags   = preference_tags['item_wise_pref_tag'][item_data.id] ? preference_tags['item_wise_pref_tag'][item_data.id] : [];
            item_data.varients = item_varients['item_id_wise'][item_data.id]
            item_data.item_modifier_group   = item_modifier_group
            item_data.item_extra_group      = item_extra_group

            var ret_data            = {}
            ret_data['cat']         = cate_obj.raw_data && cate_obj.raw_data.length ? cate_obj.raw_data[0] : ''
            ret_data['item_info']   = item_data

            return res.json({status:true, message:'Item List', type:'success', data:ret_data})
        }
        return res.json({status:false, message:'There is no data.', type:'error', data:null})

    }

    async item_tags(args){
        const tag_obj = await (new Common).get_data('item_tag',{item_id:args.item_id})
        var item_id_wise = {}
        if(tag_obj.raw_data)
        {
            for(const row_wise of tag_obj.raw_data)
            {
                if(item_id_wise[row_wise.item_id])
                item_id_wise[row_wise.item_id].push(row_wise)
                else
                item_id_wise[row_wise.item_id] = [row_wise]
            }
        }
        var ret_data = {}
        ret_data['item_id_wise'] = item_id_wise

        return ret_data

    }

}

module.exports = Customer_category;


