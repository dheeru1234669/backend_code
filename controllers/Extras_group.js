var db = require('../models');
const crypto = require('crypto');
const Item  = require("./Item");
const Common  = require("./Common");
const { Op }            = require("sequelize");

class Extras_group{

    async create_extras_group(req, res){
        var validateObj = app.formValidate(req, ['name', 'unique_name', 'options']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        console.log("body_parsefirst=== ", body_parse)

        var extras_group_obj   = await(new Extras_group).insert_extras_group({body_parse})
        if(extras_group_obj && extras_group_obj.id)
        {
            var option_obj  = await(new Extras_group).extra_group_options({body_parse, extras_group_obj})   
            return res.json({status:true, message:'Extras Group Created Successfully.', type:'success', data:option_obj});

        }
        return res.json({status:false, message:'Not inserting.', type:'error', data:null});

          
        
    }

    async insert_extras_group(args){
        var body_parse = args.body_parse
        console.log("insert_extras_group==", body_parse)

        var insert_data = {}
        body_parse.duplicate && body_parse.duplicate == 1 ? delete body_parse.id : ''

        if(body_parse.id)
        insert_data['id'] = body_parse.id 

        insert_data['name']             = body_parse.name
        insert_data['unique_name']      = body_parse.unique_name

        var ret_data = await(new Common).upsert_record('extra_group', insert_data)
        return ret_data

        /*
        return await db.extra_group.create(insert_data).then(result=>{
        return result
        }).catch(err=>{
        return false
        });*/

    }

    async extra_group_options(args){
        var body_parse      = args.body_parse
        var extras_group_obj= args.extras_group_obj

        console.log("options== ", body_parse)
        /*if(body_parse.remove_options)
        {
            var remove_options = body_parse.remove_options.split(',')
            console.log("remove_options=== ", remove_options)
            var where_delete = {where:{id:remove_options}}
            await(new Common).delete_records('extra_group_option', where)
        }*/

        var bulk_data = [];
        JSON.parse(body_parse.options).map(async row_wise => {
            var row = {}
            body_parse.duplicate && body_parse.duplicate == 1 ? delete row_wise.id : '' 
            if(row_wise.id)
            row['id']       = row_wise.id

            row['extras_group_id']  = extras_group_obj.id
            row['item_id']          = row_wise.label
            row['varient_id']       = row_wise.varient_id
            
            bulk_data.push(row)
            
            await(new Common).upsert_record('extra_group_option', row)
        })

        if(bulk_data.length>0)
        return bulk_data
        else
        return false
        /*
        if(bulk_data.length>0)
        {
            return await db.extra_group_option.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            });
        }
        else
        {
        return false
        }*/
        
    }

    async extras_group_by_id(req, res){
        var validateObj = app.formValidate(req, ['extra_group_id']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        var extras_group_obj   = await(new Extras_group).list_extras_group(req, res, {id:body_parse.extra_group_id})
        
    }

    async list_extras_group(req, res, args=null){
        var where = ''
        var replacements = ['1']
        if(args.id)
        {
            where = ' and id in (?)'
            replacements.push(args.id)
        }
        const query = `SELECT * FROM extra_groups WHERE enabled = ?${where} ORDER BY id DESC`;

        const [results, metadata] = await db.sequelize.query(query, { replacements });

        if(results){
        var dropdown_data = []
        var group_id = []
        for(const row_wise of results)
        {
            group_id.push(row_wise.id)
        }
        var extras_group_obj   = await(new Extras_group).get_extra_group_options({group_id})
        
        for(const row_wise of results)
        {
            //var options = extras_group_obj['items_extra_join'][row_wise.id] ? extras_group_obj['items_extra_join'][row_wise.id].split(',') : ''
            var extra_group_items_arr = extras_group_obj['extra_options_dtl'][row_wise.id] ? extras_group_obj['extra_options_dtl'][row_wise.id] : ''
            var extra_group_items = extras_group_obj['items_extra_join'][row_wise.id] ? extras_group_obj['items_extra_join'][row_wise.id] : ''

            dropdown_data.push({name:row_wise.name, label:row_wise.id, extra_group_items, unique_name:row_wise.unique_name, extra_group_items_arr})
        }
        var api_data = {}
        api_data['dropdown'] = dropdown_data
        api_data['results']  = results  
        if(args.from_js && args.from_js =='customer_category')
        return api_data
        else
        return res.json({status:true, message:'Extras Group List', type:'success', data:api_data});
        }
        else{
        if(args.from_js && args.from_js =='customer_category')
        return false
        else
        return res.json({status:false, message:'There is no data.', type:'warning', data:[]});
        }
        return false
    }

    async get_extra_group_options(args){
        var where = {where:{enabled:'1', extras_group_id:args.group_id}, raw:true}

        var options = []; var item_ids = {}; var group_id_wise = {};
        await db.extra_group_option.findAll(where).then(data=>{
            options = data
            data.map(row_wise => {
            if(group_id_wise[row_wise.extras_group_id])
            {
                group_id_wise[row_wise.extras_group_id].push(row_wise)
            }
            else
            {
                group_id_wise[row_wise.extras_group_id] = [row_wise]
            }

            if(item_ids[row_wise.item_id]){
            }
            else{
            item_ids[row_wise.item_id] = [row_wise.item_id]
            }
            })

        }).catch(err=>{
        return false
        });
        var item_id_wise = {};
        if(Object.keys(item_ids).length > 0)
        {
            var items   = await(new Item).items({item_ids:Object.keys(item_ids), internal:1})
            var varint_args = {}
            varint_args['all']      = 1
            varint_args['item_ids'] = Object.keys(item_ids)
            var item_varients   = await(new Item).get_item_varients(varint_args)
            var cate_info = []
            if(items.length > 0)
            {
                var cat_ids = [];
                for(const row_wise of items)
                {
                    item_id_wise[row_wise.id] = row_wise
                    cat_ids.push(row_wise.cat_id)
                }
                cate_info   = await(new Item).category_dtl({cat_ids})

                
            }
        }
        var items_extra = {}; var items_extra_join = {}; var extra_options_dtl = {}
        for (const key in group_id_wise){
            for(const row_wise of group_id_wise[key]){
                
                if(item_id_wise[row_wise.item_id] == null)
                continue;
                
                var cat_name = cate_info[item_id_wise[row_wise.item_id].cat_id] ? cate_info[item_id_wise[row_wise.item_id].cat_id].name : ''
                var item_price = item_varients['id_wise'][row_wise.item_id][0].price
                var varient_id = item_varients['id_wise'][row_wise.item_id][0].id
                if(items_extra[key])
                {
                    items_extra[key].push(item_id_wise[row_wise.item_id].name)
                    items_extra_join[key] +=','+ item_id_wise[row_wise.item_id].name

                    extra_options_dtl[key].push({id:row_wise.id, display_name:item_id_wise[row_wise.item_id].name, display_cat:cat_name, display_price:item_price, label:row_wise.item_id, varient_id})
                }
                else
                {
                    items_extra[key] = [item_id_wise[row_wise.item_id].name]
                    items_extra_join[key] = item_id_wise[row_wise.item_id].name
                    extra_options_dtl[key] = [{id:row_wise.id, display_name:item_id_wise[row_wise.item_id].name, display_cat:cat_name, display_price:item_price, label:row_wise.item_id, varient_id}]
                }
            }
        }

        var ret_data = {}
        ret_data['items_extra']     = items_extra
        ret_data['items_extra_join']= items_extra_join
        ret_data['extra_options_dtl']= extra_options_dtl

        return ret_data
    }

    async search_extras_group(req, res){
        var validateObj = app.formValidate(req, ['unique_name']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;


       var where = {where:{enabled:'1', unique_name: {[Op.like]:`%${body_parse.unique_name}%`}}}
       await db.extra_group.findAll(where).then(data=>{
           
        return res.json({status:true, message:'Extras Groups List ', type:'success', data});
       }).catch(err=>{
            return res.json({status:false, message:'Some thing went wrong', type:'error', data:err});
        });
    
    }

    async delete_extras_group(req, res){
        var validateObj = app.formValidate(req, ['extras_group_id']); 
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


        var body_parse = req.body;
        var id  = body_parse.extras_group_id

        var update_data = {};
        update_data.enabled = '2'

        var where = {where:{id}};
        db.extra_group.update(update_data,where).then(result=>{
            res.json({status:true, message:'Delete Successfully', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });

    }

    async remove_option(req, res){
        var body_parse = req.body;
        console.log("body_parse", body_parse)
        if(body_parse.remove_options)
        {
            var where_delete = {id:body_parse.remove_options}
            var delete_status = await(new Common).delete_records('extra_group_option', where_delete)
            return res.json({status:true, message:'Remove Option Successfully.', type:'success', data:delete_status})
        }
        return res.json({status:false, message:'There is no option', type:'warning', data:null})
    }
    
}

module.exports = Extras_group;
