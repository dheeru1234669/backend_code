var db          = require('../models');
const crypto    = require('crypto');
const { Op }    = require("sequelize");
var Common      = require('./Common');
var Item        = require('./Item');

class Modifier{

       async create_modifier_group(req, res){
        var validateObj = app.formValidate(req, ['name', 'unique_name', 'options']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;

        var modifier_group_obj   = await(new Modifier).insert_modifier_group({body_parse})
        if(modifier_group_obj && modifier_group_obj.id)
        {
            var option_obj  = await(new Modifier).modifier_group_options({body_parse, modifier_group_obj})   
            return res.json({status:true, message:'Modifier Group Created Successfully.', type:'success', data:option_obj});

        }
        return res.json({status:false, message:'Not inserting.', type:'error', data:null});

          
        
    }

    async insert_modifier_group(args){
        var body_parse = args.body_parse

        var insert_data = {}
        body_parse.duplicate && body_parse.duplicate == 1 ? delete body_parse.id : ''

        if(body_parse.id)
        insert_data['id'] = body_parse.id 

        insert_data['name']             = body_parse.name
        insert_data['unique_name']      = body_parse.unique_name
        //insert_data['is_require']		= body_parse.is_require
		//insert_data['max_item_select']	= body_parse.max_item_select
		//insert_data['max_time_select']	= body_parse.max_time_select


        var ret_data = await(new Common).upsert_record('modifier_group', insert_data)
        return ret_data

    }

    async modifier_group_options(args){
        var body_parse      = args.body_parse
        var modifier_group_obj= args.modifier_group_obj


        var bulk_data = [];
        var is_modifier = [];
        JSON.parse(body_parse.options).map(async row_wise => {
            var row = {}
            body_parse.duplicate && body_parse.duplicate == 1 ? delete row_wise.id : '' 
            if(row_wise.id)
            row['id']       = row_wise.id

            row['modifier_group_id']= modifier_group_obj.id
            if(row_wise.label)
            row['item_id']          = row_wise.label

            if(row_wise.varient_id)
            row['varient_id']       = row_wise.varient_id

            row['uid']              = await (new Common).unique_number()
            if(row_wise.display_name)
            row['option']	        = row_wise.display_name

            if(row_wise.display_price)
        	row['price']	        = row_wise.display_price

            if(row_wise.amount)
        	row['amount']  	        = row_wise.amount

            //if(row_wise.modifier && row_wise.modifier == 1)
            if(body_parse.map_other_group && body_parse.map_other_group == 1)
            {
                is_modifier.push(1)
                row['item_id'] = null
        	    row['map_modifier_group_id'] = row_wise.label
            }
            if(row_wise.modifier && row_wise.modifier.length > 0)
            {
                is_modifier.push(1)
                row['is_option_map_to_group'] = '1'
            }
            
            bulk_data.push(row)

            var upsert_status = await(new Common).upsert_record('modifier_option', row)
            if((upsert_status.option == row_wise.display_name) && (row_wise.modifier))
            {
                var option_status_id = upsert_status.id
                for(const inner_row of row_wise.modifier)
                {
                    var insert_data = {}
                    insert_data['modifier_option_id']       = option_status_id
                    insert_data['map_modifier_group_id']    = inner_row.label

                    var upsert_status = await(new Common).upsert_record('modifier_option_group', insert_data)
                    console.log("upsert_status== ", upsert_status)
                    if(upsert_status && upsert_status.id && inner_row.groupdata && inner_row.groupdata.length)
                    {
                        for(const nested_row of inner_row.groupdata)
                        {
                            var insert_data = {}
                            insert_data['modifier_option_id']       = option_status_id
                            insert_data['map_modifier_group_id']    = nested_row.label
                            insert_data['parent']                   = upsert_status.id

                            var upsert_status = await(new Common).upsert_record('modifier_option_group', insert_data)
                        }
                    }
                }
            }

        })
        if(is_modifier.includes(1))
        {
            var update_data = {}
            update_data.map_other_group = '1'

            var where = {where:{id:modifier_group_obj.id}}
            db.modifier_group.update(update_data,where).then(result=>{})
        }

        if(bulk_data.length>0)
        return bulk_data
        else
        return false
        
    }

    async list_modifier_group(req, res, args=null){
        var where = ''
        var replacements = ['1']
        if(args.from_js && args.from_js == 'customer_category')
        {
            console.log("mdid--- ", args.modifier_group_id)
            where = ' and id in (?)'
            replacements.push(args.modifier_group_id)
        }
        const query = `select * from modifier_groups WHERE enabled = ?${where} ORDER BY id DESC`;
        const [results, metadata] = await db.sequelize.query(query, { replacements }); 


        if(results){
        var dropdown_data = []
        var group_id = []
        for(const row_wise of results)
        {
            group_id.push(row_wise.id)
        }
        var modifiers_group_obj   = await(new Modifier).get_modifier_group_options({group_id})
        
        for(const row_wise of results)
        {
            //var options = modifiers_group_obj['items_modifier_join'][row_wise.id] ? modifiers_group_obj['items_modifier_join'][row_wise.id].split(',') : ''
            var modifier_group_items_arr = modifiers_group_obj['modifier_options_dtl'][row_wise.id] ? modifiers_group_obj['modifier_options_dtl'][row_wise.id] : ''
            var modifier_group_items = modifiers_group_obj['items_modifier_join'][row_wise.id] ? modifiers_group_obj['items_modifier_join'][row_wise.id] : ''

            dropdown_data.push({name:row_wise.name, label:row_wise.id, modifier_group_items, unique_name:row_wise.unique_name, modifier_group_items_arr})
        }
        var api_data = {}
        api_data['dropdown'] = dropdown_data
        api_data['results']  = results  
        if(args.from_js && args.from_js == 'customer_category')
        return api_data
        else
        return res.json({status:true, message:'Modifier Group List', type:'success', data:api_data});
        }
        else{
        if(args.from_js && args.from_js == 'customer_category')
        return false
        else
        return res.json({status:false, message:'There is no data.', type:'warning', data:[]});
        }
        return false
    }

    async get_modifier_group_options(args){
        var where = {where:{enabled:'1', modifier_group_id:args.group_id}, raw:true}

        var options = []; var item_ids = {}; var group_id_wise = {};
        await db.modifier_option.findAll(where).then(data=>{
            options = data
            data.map(row_wise => {
            if(group_id_wise[row_wise.modifier_group_id])
            {
                group_id_wise[row_wise.modifier_group_id].push(row_wise)
            }
            else
            {
                group_id_wise[row_wise.modifier_group_id] = [row_wise]
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
        var items_modifier = {}; var items_modifier_join = {}; var modifier_options_dtl = {}
        for (const key in group_id_wise){
            for(const row_wise of group_id_wise[key]){
                var modifier = row_wise.map_modifier_group_id ? 1 : 0
                if(item_id_wise[row_wise.item_id] == null)
                {
                    if(items_modifier[key])
                    {
                        items_modifier[key].push(row_wise.option)
                        items_modifier_join[key] +=','+ row_wise.option

                    }
                    else
                    {
                        items_modifier[key] = [row_wise.option]
                        items_modifier_join[key] = row_wise.option
                    }

                    if(modifier == 1)
                    {
                        var where = {where:{modifier_group_id:row_wise.map_modifier_group_id}, raw:true}            
                        var map_modifier_option = [];
                        await db.modifier_option.findAll(where).then(data=>{
                            data.map(row_wise => {
                                map_modifier_option.push({id:row_wise.id, display_name:row_wise.option, display_price:row_wise.price})
                            })
                        })
                    }
                    console.log("opton247=== ", row_wise.id, row_wise.is_option_map_to_group)
                    var option_modifier_group_data = ''; var option_groups_dtl_obj = '';
                    if(row_wise.is_option_map_to_group == 1)
                    {
                        var option_groups_dtl_obj   = await(new Modifier).modifier_option_groups_dtl({option_id:row_wise.id})
                        console.log("option_groups_dtl_obj== ", option_groups_dtl_obj)
                        //option_modifier_group_data = [{'id':option_groups_dtl_obj.modifier_group_obj.raw_data[0].id, 'name':option_groups_dtl_obj.modifier_group_obj.raw_data[0].name, 'options':option_groups_dtl_obj.modifiers_group_options.modifier_options_dtl[option_groups_dtl_obj.modifier_group_obj.raw_data[0].id]}]
                        option_modifier_group_data = option_groups_dtl_obj
                        row_wise.option_modifier_group_data = option_modifier_group_data
                    }
                    else
                    {
                        option_modifier_group_data          = map_modifier_option
                        row_wise.option_modifier_group_data = map_modifier_option
                    }

                    if(modifier_options_dtl[key])
                    {
                        modifier_options_dtl[key].push({id:row_wise.id, display_name:row_wise.option, display_cat:"", display_price:row_wise.price, label:"", varient_id:"", modifier, option_modifier_group_data})
                    }
                    else
                    {
                       modifier_options_dtl[key] = [{id:row_wise.id, display_name:row_wise.option, display_cat:"", display_price:row_wise.price, label:"", varient_id:"", modifier, option_modifier_group_data}] 
                    }
                }
                else
                {
                    var cat_name = cate_info[item_id_wise[row_wise.item_id].cat_id] ? cate_info[item_id_wise[row_wise.item_id].cat_id].name : ''
                    var item_price = item_varients['id_wise'][row_wise.item_id][0].price
                    var varient_id = item_varients['id_wise'][row_wise.item_id][0].id
                    if(items_modifier[key])
                    {
                        items_modifier[key].push(item_id_wise[row_wise.item_id].name)
                        items_modifier_join[key] +=','+ item_id_wise[row_wise.item_id].name

                    }
                    else
                    {
                        items_modifier[key] = [item_id_wise[row_wise.item_id].name]
                        items_modifier_join[key] = item_id_wise[row_wise.item_id].name
                    }


                    if(modifier_options_dtl[key])
                    {
                        modifier_options_dtl[key].push({id:row_wise.id, display_name:item_id_wise[row_wise.item_id].name, display_cat:cat_name, display_price:item_price, label:row_wise.item_id, varient_id, modifier})
                    }
                    else
                    {
                        modifier_options_dtl[key] = [{id:row_wise.id, display_name:item_id_wise[row_wise.item_id].name, display_cat:cat_name, display_price:item_price, label:row_wise.item_id, varient_id, modifier}]
                    }
                }
            }
        }

        var ret_data = {}
        ret_data['items_modifier']     = items_modifier
        ret_data['items_modifier_join']= items_modifier_join
        ret_data['modifier_options_dtl']= modifier_options_dtl

        return ret_data
    }
    
    async modifier_option_groups_dtl(args){
        const modifier_option_tree = await (new Modifier).modifier_option_all_nested(args)  
        if(modifier_option_tree.modifier_group && modifier_option_tree.modifier_group.length){
        return modifier_option_tree
        }
        return []
    }

    async modifier_option_groups_dtl_old1(args){
        const modifier_option_tree = await (new Modifier).modifier_option_all_nested(args)   
        if(modifier_option_tree && modifier_option_tree.length){
            for(const root of modifier_option_tree){
                await (new Modifier).parse_tree(root)
            }
        }
    }

    async parse_tree(node){
        console.log(`Node ID: ${node.id}`);
        //console.log("alldata== ", node)
        if(node.children && node.children.length > 0) {
            for (const child of node.children) {
                  //this.parse_tree(child);
            }
        }
        console.log("alldata== ", node)
    }
    async modifier_option_groups_dtl_old(args){
        const modifier_option_group_obj = await (new Common).get_data('modifier_option_group',{'modifier_option_id':args.option_id})
        await (new Modifier).modifier_option_all_nested(args)
        console.log("modifier_option_group_obj=== ", modifier_option_group_obj)
        if(modifier_option_group_obj.raw_data)
        {
            var group_ids = [];
            for(const row_wise of modifier_option_group_obj.raw_data)
            {
                group_ids.push(row_wise.map_modifier_group_id)
            }
            const modifier_group_obj = await (new Common).get_data('modifier_group',{'id':group_ids})
            var modifiers_group_options   = await(new Modifier).get_modifier_group_options({group_id:group_ids})
            var ret_data = {}
            ret_data['modifier_group_obj']      = modifier_group_obj
            ret_data['modifiers_group_options'] = modifiers_group_options

            return ret_data

        }
    }

    async modifier_option_all_nested(args){
        var option_id = args.option_id
        var tree = [], mappedArr = {}, arrElem, mappedElem;
        var group_ids = [];
        const modifier_option_group_obj = await (new Common).get_data('modifier_option_group',{'modifier_option_id':option_id})
        var arr = modifier_option_group_obj.raw_data
        for(var i = 0, len = arr.length; i < len; i++)
        {
            arrElem = arr[i];
            mappedArr[arrElem.id] = arrElem;
            mappedArr[arrElem.id]['children'] = [];
            group_ids.push(arrElem.map_modifier_group_id)
        }

        for (var id in mappedArr) {
            if (mappedArr.hasOwnProperty(id))
            {
                mappedElem = mappedArr[id]
                if (mappedElem.parent)
                {
                    mappedArr[mappedElem['parent']]['children'].push(mappedElem);
                }
                else
                {
                    tree.push(mappedElem);
                }
            }
        }
        //console.log("tree== ", tree, tree[0].children)
        const modifier_group_obj = await (new Common).get_data('modifier_group',{'id':group_ids})
        var modifiers_group_options   = await(new Modifier).get_modifier_group_options({group_id:group_ids})
        var ret_data = {}
        ret_data['group_options_name'] = []
        if(modifier_group_obj.raw_data && modifier_group_obj.raw_data.length)
        {
           for(const row_wise of modifier_group_obj.raw_data)
           {
                row_wise.options = modifiers_group_options.modifier_options_dtl[row_wise.id] ? modifiers_group_options.modifier_options_dtl[row_wise.id] : []
           }
            ret_data['group_options_name'] = modifier_group_obj.id_wise
        }
        ret_data['modifier_group']                    = tree

        return ret_data
    }

//////////////////////////////////////////
	async create_modifier_group_old(req, res){
		//var validateObj = app.formValidate(req, ['name', 'searchable_name', 'max_item_select', 'max_time_select']);
		var validateObj = app.formValidate(req, ['name', 'unique_name']);
		if(!validateObj.status)
		return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

		var body_parse = req.body;
	
		var modifier_group_obj 	= await(new Modifier).insert_modifier_group({body_parse})	
		var modifier_option_obj = await(new Modifier).insert_modifier_option({body_parse})

		if(modifier_option_obj && modifier_group_obj.id)
		{
			var bulk_data = []
			modifier_option_obj.forEach(function(item) {
				var row={}
				row['group_id'] 	= modifier_group_obj.id
				row['option_id'] 	= item.id

				bulk_data.push(row) 
    		});

			await db.mapping_group_options.bulkCreate(bulk_data).then(result=>{
            //result
            }).catch(err=>{
                //return false;
            });
			
		}
        else if(modifier_group_obj.id)
        {
            var insert_data = {}
		    insert_data['group_id'] 			= modifier_group_obj.id

		    await db.mapping_group_options.create(insert_data).then(result=>{

            }).catch(err=>{
                //return false
            });     
        }


		if(modifier_group_obj)
		return res.json({status:true, message:'Modifier Group insert', type:'success', data:modifier_group_obj});
		else
		return res.json({status:false, message:'Error', type:'error', data:null});
				
	}

	async insert_modifier_group_old(args){

		var body_parse = args.body_parse

		var insert_data = {}
		insert_data['name'] 			= body_parse.name
		insert_data['unique_name'] 		= body_parse.unique_name	
		//insert_data['is_require']		= body_parse.is_require
		//insert_data['max_item_select']	= body_parse.max_item_select
		//insert_data['max_time_select']	= body_parse.max_time_select

		return await db.modifier_group.create(insert_data).then(result=>{
			return result
        }).catch(err=>{
            return false;
        });
	}

	async insert_modifier_option(args){

        var body_parse = args.body_parse
        if(body_parse.options)
        {
		var modifier_option_parse = JSON.parse(body_parse.options)
		
		var bulk_data = []; var insert_ids = []
		for(const val of modifier_option_parse[0].option)
		{
        	var insert_data = {}
        	insert_data['uid']    	= await (new Common).unique_number() 
        	insert_data['option']	= val.name
        	insert_data['price']	= val.price
        	insert_data['amount']  	= val.amount

			bulk_data.push(insert_data)
		}
		
        return await db.modifier_option.bulkCreate(bulk_data).then(result=>{
            return result
        }).catch(err=>{
            return false;
        });
        }
    }

	async modifier_group_list(req, res){
		var group_ids  = await(new Modifier).mapping_group_option(req, res)		
		if(group_ids)
		{
			var modifier_groups_arr  = await(new Modifier).modifier_groups(group_ids)
            var dropdown_data = []
            if(modifier_groups_arr)
            {
                for(const row_wise of modifier_groups_arr)
                {
                    row_wise.label = row_wise.id
                    dropdown_data.push({name:row_wise.name, label:row_wise.id})

                }
            }
            var api_data = {}
            api_data['dropdown'] = dropdown_data
			return res.json({status:true, message:'Modifier Group List', type:'success', data:api_data});	
		}
	}

	async mapping_group_option(req, res){
		const [results, metadata] = await db.sequelize.query('select distinct group_id from mapping_group_options where enabled =?', {replacements: ['1']});
		var group_ids = []
        if(results)
        {
            for(const row_wise of results) 
            {
                group_ids.push(row_wise.group_id)  
            }   
        }
		return group_ids
	}

	async modifier_groups(group_id){
		const [results, metadata] = await db.sequelize.query('select * from modifier_groups where id  in (?) and enabled = ? order by id desc', {replacements: [group_id, '1']});
		if(results)
		{
			return results
		}
	}

	async modifier_group_detail(req, res){
		var body_parse = req.body
 
		var group_dtl  			= await(new Modifier).modifier_groups([body_parse.group_id])
		var options_of_group 	= await(new Modifier).options_groupid_wise([body_parse.group_id])
		var options_dtl 		= await(new Modifier).modifier_options(options_of_group[body_parse.group_id])

		var api_data = {}
		if(group_dtl && group_dtl.length > 0)
		{
			api_data['group']	= {'group_id': group_dtl[0].id, 'group_name':group_dtl[0].name, 'unique_name':group_dtl[0].unique_name, 'is_require': group_dtl[0].is_require, 'max_item_select': group_dtl[0].max_item_select, 'max_time_select': group_dtl[0].max_time_select}
			api_data['options'] = options_dtl

			return res.json({status:true, message:'Modifier Group Detail', type:'success', data:api_data});
		}
		else
        {
		    return res.json({status:false, message:'There is no data.', type:'warning', data:[]});
        }
		
	}

	async options_groupid_wise(group_id){
		const [results, metadata] = await db.sequelize.query('select * from mapping_group_options where group_id in(?)', {replacements: [group_id]});
		
		var group_id_wise = {}
		if(results)
		{
			for(const row_wise of results)
			{
				if(group_id_wise[row_wise.group_id])
                group_id_wise[row_wise.group_id].push(row_wise.option_id);
                else
               	group_id_wise[row_wise.group_id] = [row_wise.option_id];
			}
		}
		return group_id_wise
	}

	async modifier_options(group_id){
		const [results, metadata] = await db.sequelize.query('select * from modifier_options where id  in (?)', {replacements: [group_id]});
		if(results)
		{
			return results
		}
	}

    async search_modifier_group(req, res){
        var validateObj = app.formValidate(req, ['unique_name']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;

        //const [results, metadata] = await db.sequelize.query("select * from modifier_groups where unique_name like ?", {replacements: ["%body_parse.unique_name%"]});

       var where = {where:{enabled:'1', unique_name: {[Op.like]:`%${body_parse.unique_name}%`}}}
       await db.modifier_group.findAll(where).then(data=>{
           
        return res.json({status:true, message:'Modifier Groups', type:'success', data});
       }).catch(err=>{
            return res.json({status:false, message:'Some thing went wrong', type:'error', data:err});
        });
    
    }

    async delete_modifier_group(req, res){
        var validateObj = app.formValidate(req, ['modifier_group_id']); 
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


        var body_parse = req.body;
        var id  = body_parse.modifier_group_id

        var update_data = {};
        update_data.enabled = '2'

        var where = {where:{id}};
        db.modifier_group.update(update_data,where).then(result=>{
            res.json({status:true, message:'Delete Successfully', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });

    }
    
    async update_modifier_group_main(req, res){
        var validateObj = app.formValidate(req, ['name', 'unique_name', 'max_item_select', 'max_time_select', 'group_id']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        var modifier_group_obj  = await(new Modifier).update_modifier_group({body_parse})
        
        var modifier_mapping_option_obj  = await(new Modifier).update_mapping_group_options({body_parse})
        if(modifier_mapping_option_obj)
        {
            var modifier_option_obj = await(new Modifier).insert_modifier_option({body_parse})
            var modifier_mapping_create = await(new Modifier).create_mapping_group_option({body_parse, modifier_option_obj, modifier_group_obj:{id:body_parse.group_id}})
            if(modifier_mapping_create)
            return res.json({status:true, message:'Modifier Group update', type:'success', data:modifier_group_obj});
            else
            return res.json({status:false, message:'Error', type:'error', data:null})
        }
        else
        {
            if(modifier_group_obj.length > 0)
            return res.json({status:true, message:'Modifier Group update', type:'success', data:modifier_group_obj});
            else
            return res.json({status:false, message:'Error', type:'error', data:null})
        }
    }

    async update_modifier_group(args){
        var body_parse = args.body_parse

        var update_data = {}
        update_data['name']             = body_parse.name
        update_data['unique_name']      = body_parse.searchable_name
        update_data['is_require']       = body_parse.is_require
        update_data['max_item_select']  = body_parse.max_item_select
        update_data['max_time_select']  = body_parse.max_time_select

        var where = {where: {id:body_parse.group_id}}
        return await db.modifier_group.update(update_data,where).then(result=>{
            return result
            }).catch(err=>{
            return false
            });

    }

    async update_mapping_group_options(args){
        var body_parse = args.body_parse
        if(body_parse.modifier_option)
        {
            var update_data = {}
            update_data['enabled'] ='0'
            var where = {where: {group_id:body_parse.group_id}} 
           return await db.mapping_group_options.update(update_data, where).then(result=>{
            return result
           }).catch(err=>{
            return false
           });
        }
    }

    async create_mapping_group_option(args){

        var body_parse          = args.body_parse
        var modifier_option_obj = args.modifier_option_obj
        var modifier_group_obj  = args.modifier_group_obj

        if(modifier_option_obj && modifier_group_obj.id)
        {
            var bulk_data = []
            modifier_option_obj.forEach(function(item) {
				var row={}
				row['group_id'] 	= modifier_group_obj.id
				row['option_id'] 	= item.id

				bulk_data.push(row) 
    		});
            return await db.mapping_group_options.bulkCreate(bulk_data).then(result=>{
                return result
            }).catch(err=>{
                return false
            })
        }
        else if(modifier_group_obj.id)
        {
            var insert_data = {}
            insert_data['group_id']             = modifier_group_obj.id

            await db.mapping_group_options.create(insert_data).then(result=>{
                return result
            }).catch(err=>{
                return false
            })

        }

    }

    async add_modifier_option(req, res){
        var validateObj = app.formValidate(req, ['group_id']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        var modifier_option_obj = await(new Modifier).insert_modifier_option({body_parse})
        var modifier_mapping_create = await(new Modifier).create_mapping_group_option({body_parse, modifier_option_obj, modifier_group_obj: {id:body_parse.group_id}})

        if(modifier_mapping_create)
        return res.json({status:true, message:'Modifier Group Option Added', type:'success', data:modifier_mapping_create});  
        else
        return res.json({status:false, message:'Error', type:'error', data:null})
    }

    async list_modifier_group_filter(req, res, args=null){
        const [results, metadata] = await db.sequelize.query('select * from modifier_groups where enabled =? and map_other_group=? order by id DESC', {replacements: ['1','0']});

        if(results){
        var dropdown_data = []
        var group_id = []
        for(const row_wise of results)
        {
            group_id.push(row_wise.id)
        }
        var modifiers_group_obj   = await(new Modifier).get_modifier_group_options({group_id})
        
        for(const row_wise of results)
        {
            //var options = modifiers_group_obj['items_modifier_join'][row_wise.id] ? modifiers_group_obj['items_modifier_join'][row_wise.id].split(',') : ''
            var modifier_group_items_arr = modifiers_group_obj['modifier_options_dtl'][row_wise.id] ? modifiers_group_obj['modifier_options_dtl'][row_wise.id] : ''
            var modifier_group_items = modifiers_group_obj['items_modifier_join'][row_wise.id] ? modifiers_group_obj['items_modifier_join'][row_wise.id] : ''

            dropdown_data.push({name:row_wise.name, display_name:row_wise.name, label:row_wise.id, modifier_group_items, unique_name:row_wise.unique_name, modifier_group_items_arr})
        }
        var api_data = {}
        api_data['dropdown'] = dropdown_data
        api_data['results']  = results   
        return res.json({status:true, message:'Modifier Group List', type:'success', data:api_data});
        }
        else{
        return res.json({status:false, message:'There is no data.', type:'warning', data:[]});
        }
        return false
    }

}

module.exports = Modifier;
