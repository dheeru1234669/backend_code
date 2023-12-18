var db              = require('../models');
var path            = require('path');
const crypto        = require('crypto');
const Helper        = require("./helpers/Index");
const Tag           = require("./Tag");
const { Op }        = require("sequelize");
var Common          = require('./Common');


class Item{

	async create_item(req, res){
		var validateObj = app.formValidate(req, ['item_uid', 'fulfillment_by', 'prepared_time']);
		if(!validateObj.status)
		return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

		var body_parse = req.body

        //if (!req.files)
        //if(!req.files.upload_imgs)
        //return res.json({status:false, message:'Image is required.', type:'error', data:null});

        var is_validate = {}

        if(req.files && req.files.upload_imgs)
        {
            var is_validate = await(new Common).valid_upload_files_multiple({file_arr:req.files.upload_imgs})
            if(is_validate.status == 0)
            return res.json({status:false, message:is_validate.msg, type:'error', data:null});    
            
        }

        if(!body_parse.id)
        {
            var is_exist_item_uid_obj   = await(new Item).is_exist_item_uid({item_uid:body_parse.item_uid})
            if(is_exist_item_uid_obj)
            return res.json({status:false, message:'Unique Item UID Required.', type:'warning', data:null})
        }

        //return false;
		var item_table_status	= await(new Item).item_table({body_parse})
        console.log("item_table_status== ", item_table_status)
    
        if(item_table_status.id)
        {
            var item_img_status     = await(new Item).create_item_images({req, body_parse, item_arg:item_table_status})

            var category_updt_obj   = await(new Item).category_updt({body_parse, item_arg:item_table_status})
		    var varient_obj         = await(new Item).varient({body_parse, item_arg:item_table_status})
            if(varient_obj)
            {
		        var price_variations_obj= await(new Item).price_variations({body_parse, item_arg:item_table_status, varient_obj})
            }

		    var visibility_obj      = await(new Item).item_visibility({body_parse, item_arg:item_table_status})
		    var tag_obj             = await(new Item).item_tag({body_parse, item_arg:item_table_status})
		    var prefr_tag_obj       = await(new Item).item_preference_tag({body_parse, item_arg:item_table_status})
		    var extras_group_obj    = await(new Item).item_extras_group({body_parse, item_arg:item_table_status})
		    var modifier_group_obj  = await(new Item).item_modifier_group({body_parse, item_arg:item_table_status})
            var msg = item_table_status.current_id ? 'Item Updated Successfully.' : 'Item Created Successfully.'
            if(varient_obj)
            return res.json({status:true, message:msg, type:'success', data:varient_obj});
            else
            return res.json({status:false, message:'Something went wrong', type:'error', data:null});
        }
        else
        {
            return res.json({status:false, message:'Some DB Error', type:'error', data:null});
        }
        
			
	}

    async is_exist_item_uid(args){
        const is_valid_item_uid = await (new Common).get_data('item',{item_uid:args.item_uid})
        if(is_valid_item_uid.raw_data && is_valid_item_uid.raw_data.length)
        return 1
        else
        return 0
    }
    async validate_image(req, res){
        const file_image = req.files.item_image;
        const extensionName = path.extname(file_image.name)
        const file_size     = file_image.size
        const array_of_allowed_files = ['.png', '.jpeg', '.jpg', '.webp']
        if(!array_of_allowed_files.includes(extensionName))
        return res.json({status:false, message:'Image type not valid.', type:'error', data:null});

        var size = 50 * 1024 * 1024
        if(file_size > size)
        return res.json({status:false, message:'Image size exceed.', type:'error', data:null})

        return true
   }

	async item_table(args){
		var body_parse = args.body_parse
        var is_time_visibil = '0'; var show_hide_item = '0';

        if(body_parse.visibility)
        {
            var visibility  = JSON.parse(body_parse.visibility)
            var time_visibility = visibility.time_base_visibility_arr
            is_time_visibil = time_visibility && time_visibility.length > 0 ? '1' : '0' 
            show_hide_item = visibility.show_hide_item
        }


		var insert_data = {}
		insert_data.item_uid 	= body_parse.item_uid
		insert_data.code 		= body_parse.code
		insert_data.cat_id		= body_parse.parent
		insert_data.name		= body_parse.product_name
		insert_data.fulfillment_by  = body_parse.fulfillment_by
		insert_data.prepared_time  = body_parse.prepared_time
		insert_data.short_desc  = body_parse.short_desc
		insert_data.long_desc   = body_parse.long_desc
		insert_data.out_of_stock = body_parse.out_of_stock ? '1':'0'	
		insert_data.enabled     = body_parse.enabled ? '0' : '1'
		insert_data.is_visible  = body_parse.is_visible
		insert_data.visibility  = show_hide_item
        //insert_data.time_visibility = is_time_visibil 

        if(body_parse.id)
        {
            delete insert_data.cat_id
            delete insert_data.item_uid
            
            var where = {where:{id:body_parse.id}}
            return await db.item.update(insert_data, where).then(result=>{
                if(result.length)
                return {id:body_parse.id, current_id:body_parse.id}
            }).catch(err=>{return false;});
        }
        else
        {
		    return await db.item.create(insert_data).then(result=>{return result
            }).catch(err=>{return false;});	
		}
	}

	async varient_tbl_old(args){
		var body_parse 	= args.body_parse
		var item_arg 	= args.item_arg

		
        var cnt=0; var bulk_data = [];
        if(typeof body_parse["price[]"] == 'string')
        {
            var row = {}
            row['item_id']   = item_arg.id
            row['unique_id'] = await (new Common).unique_number()
            row['price']     = body_parse["price[]"]
            row['size']      = body_parse["size[]"]

            bulk_data.push(row)
        }
        else
        {
        for(const row_wise of body_parse["price[]"])
        {
           var row = {}
           row['item_id']   = item_arg.id
           row['unique_id'] = await (new Common).unique_number()
           row['price']     = body_parse["price[]"][cnt]
           row['size']      = body_parse["size[]"][cnt]

           bulk_data.push(row)
           cnt++
        }
        }

	
        if(bulk_data.length>0)
        {
		    return await db.item_varient.bulkCreate(bulk_data).then(result=>{
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

    async varient(args){
        var body_parse  = args.body_parse
        var item_arg    = args.item_arg

        var bulk_data = []; var result_ret = {}; const promises = [];
        var upsert_item_varient = {};
        JSON.parse(body_parse.varients).map(async row_wise => {
            var row = {}
            if(row_wise.id)
            row['id']       = row_wise.id

            row['item_id']  = item_arg.id
            row['unique_id']= await (new Common).unique_number()
            row['price']    = row_wise.price
            row['size']     = row_wise.size
            row['barcode']  = row_wise.barcode
            row['item_uid'] = row_wise.uid

            var price_size = row['price']+'#|#'+row['size']
            result_ret[price_size] = row
            bulk_data.push(row)

            upsert_item_varient = await(new Item).upsert_record('item_varient', row)
            if(upsert_item_varient.id)
            {
                price_size = upsert_item_varient.price+'#|#'+upsert_item_varient.size
                result_ret[price_size] = upsert_item_varient
            }

        })

        if(bulk_data.length>0)
        {
            return result_ret
        }
        else if(Object.keys(result_ret).length)
        {
            return result_ret
        }
        return false
    }

    async create_item_images(args){
        var req         = args.req
        var body_parse  = args.body_parse
        var item_arg    = args.item_arg

        if(body_parse.image_db_ids)
        {
            const delete_images = await (new Common).delete_not_in_records({table_name:'item_image', item_id:item_arg.id, ids:body_parse.image_db_ids}) 
        }

        var bulk_data = []
        if(req.files && item_arg.id)
        {
            var upload_imgs = req.files.upload_imgs
            if(typeof upload_imgs == 'object' && upload_imgs.length == 1)
            upload_imgs = [upload_imgs];

            if(upload_imgs.length)
            {
            for(const row_wise of upload_imgs)
            {
                const d = new Date()
                let time = d.getTime()
                const file_image    = row_wise
                const extensionName = path.extname(file_image.name)
                var modify_img_name = time+''+extensionName

                file_image.mv('./uploads/item_images/' + modify_img_name);
                var row = {}
                row.item_id = item_arg.id
                row.name    = modify_img_name

                bulk_data.push(row)
            }
            }
        }

        if(bulk_data.length>0)
        {
            return await db.item_image.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            });
        }
        return false 
    }

    async category_updt(args){
       var body_parse = args.body_parse 

        var update_data = {}
        update_data['is_add_item'] = '1'

        if(!body_parse.parent)
        return false

        var where = {where:{id:body_parse.parent}}
        db.category.update(update_data,where).then(result=>{
        return result
        }).catch(err=>{
        return false
        })
    }

	async cat_and_item(req, res){
		const [results, metadata] = await db.sequelize.query('SELECT * FROM categories', {replacements: []});
	
		if(results)
		{
			var tree = await(new Item).array_to_tree(results)
			return res.json({status:true, message:'category List', type:'success', data:tree});
		}
		return res.json({status:true, message:'There is no data.', type:'warning', data:[]});
	}		


	async array_to_tree(arr){
		var tree = [], mappedArr = {}, arrElem, mappedElem;
     
		for(var i = 0, len = arr.length; i < len; i++)
		{
        	arrElem = arr[i];
        	mappedArr[arrElem.id] = arrElem;
        	mappedArr[arrElem.id]['children'] = [];
      	}


      	for (var id in mappedArr) {
        	if (mappedArr.hasOwnProperty(id)) 
			{
        		mappedElem = mappedArr[id]
        
                mappedElem['items'] = []
                if(mappedElem.is_add_item == 1)
                mappedElem['items'] = await(new Item).item_cat_wise_get({cat_id:mappedElem.id})

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
      	return tree;
    }

    async item_cat_wise_get(args){
        //var where = {where:{cat_id:args.cat_id, enabled:'1'}, raw:true}
        var where = {where:{cat_id:args.cat_id}, raw:true}
        var items = []; var items_arr = []
        await db.item.findAll(where).then(result=>{
            result.map(async row_wise=>{
                items.push(row_wise.id)
                items_arr.push(row_wise)
            })
        //return result
        }).catch(err=>{
        return false
        })

        var item_images_obj     = await(new Item).item_images({items})
        var item_varients_obj   = await(new Item).item_varients({items})


        items_arr.map(async row_wise=>{
            if(item_images_obj[row_wise.id] && item_images_obj[row_wise.id].name)
            row_wise.img_mdfy = app.url+'/item_images/'+item_images_obj[row_wise.id].name
            else
            row_wise.img_mdfy = app.url+'/loc_images/location-profile.PNG'

            if(item_varients_obj && item_varients_obj[row_wise.id] && item_varients_obj[row_wise.id][0].price)
            row_wise.price  = item_varients_obj[row_wise.id][0].price
            
        })

        return items_arr
    }

    async item_images(args){
        var where = {where:{item_id:args.items, enabled:'1'}, order: [['id', 'ASC'],], raw:true}
        var images = {}
        await db.item_image.findAll(where).then(result=>{
            result.map(async row_wise=>{
                images[row_wise.item_id] = row_wise
            })
        }).catch(err=>{
        return false
        })
        return images
    }

    async item_varients(args){
        var where = {where:{item_id:args.items, enabled:'1'}, raw:true}
        var itm_vrnts = {}
        await db.item_varient.findAll(where).then(result=>{
            result.map(async row_wise=>{
                if(itm_vrnts[row_wise.item_id])
                itm_vrnts[row_wise.item_id].push(row_wise)
                else
                itm_vrnts[row_wise.item_id] = [row_wise]
            })
        }).catch(err=>{
        return false
        })

        return itm_vrnts
    }

    async isvalid_create_visibility(req, res){
        var body_parse = req.body;
        var is_uniq_day_name = {}
        var daysName = app.daysName()

        for(const row_wise of JSON.parse(body_parse.time_base_visibility))
        {
            if(is_uniq_day_name[row_wise.day_name])
            return res.json({status:false, message: 'duplicate name '+ daysName[row_wise], type:'warning', data:[]});
            else
            is_uniq_day_name[row_wise.day_name] = row_wise

            if(row_wise.from > row_wise.end)
            return res.json({status:false, message: 'End Time should be greater in '+ daysName[row_wise.day_name], type:'warning', data:[]})

        }
        return res.json({status:true, message: 'Valid', type:'success', data:body_parse})

    }

    async item_visibility(args){
        var body_parse = args.body_parse
        var item_arg    = args.item_arg
        var visibility  = JSON.parse(body_parse.visibility)
        var time_visibility = visibility.time_base_visibility_arr

        var bulk_data = [];
        
        if(time_visibility && time_visibility.length > 0)
        {
            time_visibility.map(async row_wise=>{
                    var row = {}
                    if(row_wise.id)
                    row['id']       = row_wise.id

                    row['item_id'] = item_arg.id
                    row['show_hide_item'] = visibility.show_hide_item
                    row['day_id'] = row_wise.day_id
                    row['start_time'] = row_wise.from
                    row['end_time'] = row_wise.end

                    bulk_data.push(row)
                    
                    await(new Item).upsert_record('item_visibility', row)

                    })
        }
        if(bulk_data.length>0)
        {
            return bulk_data
            /*
		    return await db.item_visibility.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            });*/
        }
        else
        {
            return false
        } 

    }

    async item_tag(args){
        var body_parse  = args.body_parse
        var item_arg    = args.item_arg

        if(!body_parse.tags || body_parse.tags === 'undefined')
        return false

        var tags        = JSON.parse(body_parse.tags) 
        
        var bulk_data = [];
        if(Object.keys(tags).length)
        {
        Object.keys(tags).map(row_wise=>{
            var row={}
            row['item_id']  = item_arg.id
            row['tag_id']   = row_wise

            bulk_data.push(row)
        })

        if(bulk_data.length>0)
        {
            return await db.item_tag.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            }); 
        }
        }
        return false
    }

    async item_preference_tag(args){
        var body_parse  = args.body_parse
        var item_arg    = args.item_arg

        if(!body_parse.preference_tags || body_parse.preference_tags === 'undefined')
        return false

        if(item_arg.id)
        {
            var rows_deleted = await(new Item).delete_records({table_name:'item_preference_tag', where_condi:{item_id:item_arg.id}})
        }

        var tags        = JSON.parse(body_parse.preference_tags) 
        
        var bulk_data = [];
        if(Object.keys(tags).length)
        {
        Object.keys(tags).map(row_wise=>{
            var row={}
            row['item_id']          = item_arg.id
            row['preference_tag_id']= row_wise

            bulk_data.push(row)
        })

        if(bulk_data.length>0)
        {
            return await db.item_preference_tag.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            }); 
        }
        }
        return false
    }

    async item_extras_group(args){
        var body_parse  = args.body_parse
        var item_arg    = args.item_arg

        if(!body_parse.extras_group || body_parse.extras_group === 'undefined')
        return false

        var extras_group        = JSON.parse(body_parse.extras_group) 
        
        var bulk_data = [];
        if(extras_group.length)
        {
        extras_group.map(row_wise=>{
            var row={}
            row['item_id']          = item_arg.id
            row['extra_group_id']= row_wise.label

            bulk_data.push(row)
        })

        if(bulk_data.length>0)
        {
            return await db.item_extra_group.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            }); 
        }
        }
        return false
    }

    async item_modifier_group(args){
        var body_parse  = args.body_parse
        var item_arg    = args.item_arg

        console.log("body_parse573+++ ", body_parse)
        if(!body_parse.modifier_group || body_parse.modifier_group === 'undefined')
        return false

        console.log("body_parse573=== ", body_parse)
        if(item_arg.id) 
        {
            var rows_deleted = await(new Item).delete_records({table_name:'item_modifier_group', where_condi:{item_id:item_arg.id}})
        }

        var modifier_group        = JSON.parse(body_parse.modifier_group)

        var bulk_data = [];
        if(modifier_group.length)
        {
        modifier_group.map(row_wise=>{
            var row={}
            row['item_id']          = item_arg.id
            row['modifier_group_id']= row_wise.label

            bulk_data.push(row)
        })

        if(bulk_data.length>0)
        {
            return await db.item_modifier_group.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            }); 
        }
        }
        return false

    }

    async isvalid_item_varient(req, res){
        var body_parse = req.body;
        JSON.parse(body_parse.selected_varients).map(row_wise=>{
            if(row_wise.size == body_parse.size)
            {
               return res.json({status:false, message: 'Size already selected', type:'warning', data:[]}) 
            }
        })
        return res.json({status:true, message: 'Valid', type:'success', data:body_parse})
    }


    async isvalid_price_variation(req, res){
        var body_parse = req.body;
        var is_uniq_day_name = {}; var is_uniq_time_name = {};
        var daysName = app.daysName()

        if(body_parse.day_exception_added_arr != 'undefined')
        {
            JSON.parse(body_parse.day_exception_added_arr).map(row_wise=>{
                if(is_uniq_day_name[row_wise.day])
                return res.json({status:false, message: 'duplicate name '+ daysName[row_wise.day] + ' in Day Exception', type:'warning', data:[]});
                else
                is_uniq_day_name[row_wise.day] = row_wise

            })
        }
        if(body_parse.time_exception_added_arr != 'undefined')
        {
            JSON.parse(body_parse.time_exception_added_arr).map(row_wise=>{
                if(is_uniq_time_name[row_wise.day])
                return res.json({status:false, message: 'duplicate name '+ daysName[row_wise.day]+ ' in Time Exception', type:'warning', data:[]});
                else
                is_uniq_time_name[row_wise.day] = row_wise

                if(row_wise.start > row_wise.end)
                return res.json({status:false, message: 'End Time should be greater in '+ daysName[row_wise.day]+ ' in Time Exception', type:'warning', data:[]})

            })
        }


        return res.json({status:true, message: 'Valid', type:'success', data:body_parse})

    }


    async price_variations(args){
        var body_parse      = args.body_parse
        var item_arg        = args.item_arg
        var varient_status  = args.varient_obj
        
        var cnt=0; var bulk_data = [];

        var price_variations = JSON.parse(body_parse.price_variations)
        
        var day_wise_bulk = []; var time_wise_bulk = [];


        for(const [key, value] of Object.entries(price_variations)){
            if(varient_status[key]){
            if(value[0] && value[0].day_wise){
                for (const row_wise of value[0].day_wise) {
                    var row = {}
                    row['item_id']     = item_arg.id
                    row['varient_id']   = varient_status[key].id
                    row['varient_hash'] = key
                    row['day']          = row_wise.day
                    row['price']        = row_wise.price
                
                    day_wise_bulk.push(row)
                    await(new Item).upsert_record('item_price_day_exception', row)
                }
            }
            if(value[1] && value[1].time_wise){
                for (const row_wise of value[1].time_wise) {
                    var row = {}
                    row['item_id']     = item_arg.id
                    row['varient_id']   = varient_status[key].id
                    row['varient_hash'] = key
                    row['day']          = row_wise.day
                    row['price']        = row_wise.price
                    row['start_time']   = row_wise.start
                    row['end_time']     = row_wise.end
                
                    time_wise_bulk.push(row)
                    await(new Item).upsert_record('item_price_time_exceptions', row)
                }
            }
            }
            
        }
        
        var ret_data = {}
        if(day_wise_bulk.length>0)
        {
            ret_data['day_wise'] = day_wise_bulk 
        }
        if(time_wise_bulk.length>0)
        {
            ret_data['time_wise'] = time_wise_bulk
        }
        /*
        if(day_wise_bulk.length>0)
        {
            await db.item_price_day_exception.bulkCreate(day_wise_bulk).then(result=>{
            ret_data['day_wise'] = result
            }).catch(err=>{
            })
        }

        if(time_wise_bulk.length>0)
        {
            await db.item_price_time_exceptions.bulkCreate(time_wise_bulk).then(result=>{
            ret_data['time_wise'] = result
            }).catch(err=>{
            })
        }*/

        return ret_data

    }

    async get_item(req, res){
        var validateObj = app.formValidate(req, ['item_uid'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null})

        var body_parse = req.body

        //var get_data = await(new Helper).get_data({name:'items', where:JSON.stringify({item_uid:body_parse.item_uid})})
        
        var item_obj = {}
        var item_info       = await(new Item).get_item_info({body_parse})
        item_obj['db_data_info'] = item_info
        if(item_info && item_info.id)
        {
            item_obj['db_item_images']  = await(new Item).get_item_images({body_parse, item_info})
            item_obj['db_visibility']   = await(new Item).get_item_visibility({body_parse, item_info})
            item_obj['db_varients']     = await(new Item).get_item_varients({body_parse, item_info})
            item_obj['db_day_excpton']  = await(new Item).get_price_day_exceptions({body_parse, item_info})
            item_obj['db_time_excpton'] = await(new Item).get_price_tim_exceptions({body_parse, item_info})
            item_obj['db_modifier_group'] = await(new Item).get_modifier_group({body_parse, item_info})
            item_obj['db_extras_group'] = await(new Item).get_extras_group({body_parse, item_info})
            item_obj['db_tag']          = await(new Item).get_item_tag({req, res, body_parse, item_info})
            item_obj['db_preference_tag']= await(new Item).get_item_preference_tag({req, res, body_parse, item_info})
            
        }

        return res.json({status:true, message:'Item Details', type:'success', data:item_obj}); 

    }

    async get_item_info(args){
        var body_parse = args.body_parse
        //var where       = {where:{item_uid:body_parse.item_uid, enabled:'1'}, raw:true}
        var where       = {where:{item_uid:body_parse.item_uid}, raw:true}
        
        var item_data = '';
        return await db.item.findOne(where).then(result=>{
        return result     
        }) 
        return false
    }

    async get_item_images(args){
        var body_parse  = args.body_parse
        var item_info   = args.item_info

        var where       = {where:{item_id:item_info.id, enabled:'1'}, order: [['id', 'DESC'],],raw:true}
        
        var item_data = []; var only_images = []; var img_info = [];
        await db.item_image.findAll(where).then(result=>{
            result.map(async row_wise=>{
                row_wise.img_url = app.url+'/item_images/'+row_wise.name
                item_data.push(row_wise)
                only_images.push(row_wise.img_url)
                img_info.push({id:row_wise.id, name:row_wise.name})
            })
        }) 
        var ret_data = {}
        ret_data['item_data']   = item_data
        ret_data['only_images'] = only_images
        ret_data['img_info']    = img_info

        return ret_data
        return false
    }

    async get_item_visibility(args){
        var body_parse  = args.body_parse
        var item_info   = args.item_info

        var where       = {where:{item_id:item_info.id}, raw:true}
        var item_data = []; var visibility_arr = [];
        await db.item_visibility.findAll(where).then(result=>{
            result.map(async row_wise=>{
                item_data.push(row_wise);
                visibility_arr.push({id:row_wise.id, day_id:row_wise.day_id, from:row_wise.start_time, end:row_wise.end_time})

            })
        }) 
        var ret_data = {}
        ret_data['item_data']       = item_data
        ret_data['visibility_arr']  = visibility_arr
        return ret_data

        return false

    }

    async get_item_varients(args){
        var body_parse = ''; var item_info = {};
        if(args.all && args.all == 1)
        {
            item_info.id = args.item_ids    
        }
        else
        {
            body_parse  = args.body_parse
            item_info   = args.item_info
        }
        var where       = {where:{item_id:item_info.id}, raw:true}
        var item_data = []; var item_id_wise = {};
        await db.item_varient.findAll(where).then(result=>{
            result.map(async row_wise=>{
                item_data.push(row_wise)
                if(item_id_wise[row_wise.item_id])
                {
                    item_id_wise[row_wise.item_id].push(row_wise)
                }
                else
                {
                    item_id_wise[row_wise.item_id] = [row_wise]
                }

            })
        })

        var ret_data = {}
        ret_data['id_wise'] = item_id_wise
        ret_data['item_data'] = item_data

        return ret_data
        return false

    }

    async get_price_day_exceptions(args){
        var body_parse  = args.body_parse
        var item_info   = args.item_info

        var where       = {where:{item_id:item_info.id}, raw:true}
        var item_data = []; var price_day_data = {};
        await db.item_price_day_exception.findAll(where).then(result=>{
            result.map(async row_wise=>{
                item_data.push(row_wise)
                if(price_day_data[row_wise.varient_id])
                price_day_data[row_wise.varient_id].push({id:row_wise.id, day:row_wise.day, price:row_wise.price})
                else
                price_day_data[row_wise.varient_id] = [{id:row_wise.id, day:row_wise.day, price:row_wise.price}]
            })
        }) 
        var ret_data = {}
        ret_data['item_data'] = item_data
        ret_data['price_day'] = price_day_data
        return ret_data
        return false

    }

    async get_price_tim_exceptions(args){
        var body_parse  = args.body_parse
        var item_info   = args.item_info

        var where       = {where:{item_id:item_info.id}, raw:true}
        var item_data = []; var price_time_data = {};
        await db.item_price_time_exceptions.findAll(where).then(result=>{
            result.map(async row_wise=>{
                item_data.push(row_wise)
                if(price_time_data[row_wise.varient_id])
                price_time_data[row_wise.varient_id].push({id:row_wise.id, day:row_wise.day, price:row_wise.price, start:row_wise.start_time, end:row_wise.end_time})
                else
                price_time_data[row_wise.varient_id] = [{id:row_wise.id, day:row_wise.day, price:row_wise.price, start:row_wise.start_time, end:row_wise.end_time}]
            })
        })
        var ret_data = {}
        ret_data['item_data'] = item_data
        ret_data['price_time'] = price_time_data
        return ret_data

        return false

    }

    async get_extras_group(args){
        var body_parse  = args.body_parse
        var item_info   = args.item_info

        var where       = {where:{item_id:item_info.id}, raw:true}

        var extra_group_ids = []
        await db.item_extra_group.findAll(where).then(result=>{
            result.map(async row_wise=>{
                extra_group_ids.push(row_wise.extra_group_id)
            })
        })
        var extra_args = {}
        extra_args['extra_group_ids'] = extra_group_ids
        var extras_group_dtl   = await(new Item).extras_group_by_id(extra_args)

        var ret_data = {}
        ret_data['extras_group_dtl'] = extras_group_dtl
        ret_data['extra_group_ids']  = extra_group_ids

        return ret_data

    }

    async get_modifier_group(args){
        var body_parse  = args.body_parse
        var item_info   = args.item_info

        var where       = {where:{item_id:item_info.id}, raw:true}

        var modifier_group_ids = []
        await db.item_modifier_group.findAll(where).then(result=>{
            result.map(async row_wise=>{
                modifier_group_ids.push(row_wise.modifier_group_id)
            })
        })
        var modifier_args = {}
        modifier_args['modifier_group_ids'] = modifier_group_ids
        var modifier_group_dtl   = await(new Item).modifier_group_by_id(modifier_args)

        var ret_data = {}
        ret_data['modifier_group_dtl'] = modifier_group_dtl
        ret_data['modifier_group_ids'] = modifier_group_ids

        return ret_data

    } 

    async get_item_tag(args){
        var {body_parse, item_info} = args
        
        var where       = {where:{item_id:item_info.id}, raw:true}

        var tag_ids = []
        await db.item_tag.findAll(where).then(result=>{
            result.map(async row_wise=>{
                tag_ids.push(row_wise.tag_id)
            })
        })
        var tag_args = {}; var ret_data = {};
        tag_args['tag_ids'] = tag_ids

        ret_data['tag'] = await(new Tag).list_tag(args.req, args.res, tag_args)

        return ret_data;
    }

    async get_item_preference_tag(args){
        var {body_parse, item_info} = args
    
        console.log("item_info=== ", item_info)
        var where       = {where:{item_id:item_info.id}, raw:true}

        var pref_tag_ids = []; var item_wise = {}
        await db.item_preference_tag.findAll(where).then(result=>{
            result.map(async row_wise=>{
                pref_tag_ids.push(row_wise.preference_tag_id)

                if(item_wise[row_wise.item_id])
                item_wise[row_wise.item_id].push(row_wise)
                else
                item_wise[row_wise.item_id] = [row_wise]
            })
        })

        var pref_args = {}; var ret_data = {};
        pref_args['pref_tag_ids'] = pref_tag_ids

        ret_data['pref_tag'] = await(new Tag).list_pref_tag_for_customer(args.req, args.res, pref_args)
        ret_data['item_wise_pref_tag'] = item_wise

        return ret_data;
    }

    async extras_group_by_id(args){
        var where = {where:{enabled:'1', id:args.extra_group_ids}, raw:true}
        var extra_group_data = []
        await db.extra_group.findAll(where).then(result=>{
            result.map(async row_wise=>{
                extra_group_data.push({name:row_wise.name, label:row_wise.id})
            })
        }).catch(err=>{
        return false
        })
        return extra_group_data
    }

    async modifier_group_by_id(args){
        var where = {where:{enabled:'1', id:args.modifier_group_ids}, raw:true}
        var modifier_group_data = []
        await db.modifier_group.findAll(where).then(result=>{
            result.map(async row_wise=>{
                modifier_group_data.push({name:row_wise.name, label:row_wise.id})
            })
        }).catch(err=>{
        return false
        })
        return modifier_group_data
    }

    async item_search(req, res){
        var validateObj = app.formValidate(req, ['name']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        var items_arr     = await(new Item).item_search_by_name({body_parse})
        if(items_arr.length)
        {
            var item_ids = []
            for(const row_wise of items_arr)
            {
                item_ids.push(row_wise.id)   
            }
            var agrs = {}
            agrs['all']     = 1
            agrs['item_ids']= item_ids
            var item_varients   = await(new Item).get_item_varients(agrs)
            
            var item_api_info = {}
            for(const row_wise of items_arr)
            {
                row_wise.price = item_varients['id_wise'][row_wise.id][0].price
                row_wise.size = item_varients['id_wise'][row_wise.id][0].size

            }
            return res.json({status:true, message:'Item List', type:'success', data:items_arr}) 
        }
        return res.json({status:false, message:'There is no data', type:'warning', data:[]})
       
    
    }

    async item_search_by_name(args){
        var body_parse = args.body_parse

        var where = {where:{enabled:'1', name: {[Op.like]:`%${body_parse.name}%`}}}
        return await db.item.findAll(where).then(data=>{
            return data   
        }).catch(err=>{
            return false
        }); 
    }

    async all_item_info(req, res){
        var items_arr = await(new Item).items()
        if(items_arr)
        {
            var item_ids = []; var cat_ids = [];
            for(const row_wise of items_arr)
            {
                item_ids.push(row_wise.id)   
                cat_ids.push(row_wise.cat_id)   
            }
            var agrs = {}
            agrs['all']     = 1
            agrs['item_ids']= item_ids
            var item_varients   = await(new Item).get_item_varients(agrs)

            var cate_info   = await(new Item).category_dtl({cat_ids})
            
            var item_api_info = []
            for(const row_wise of items_arr)
            {
                row_wise.price = item_varients['id_wise'][row_wise.id][0].price
                row_wise.size = item_varients['id_wise'][row_wise.id][0].size
                var varient_id = item_varients['id_wise'][row_wise.id][0].id
                row_wise.cat_name = cate_info[row_wise.cat_id] ? cate_info[row_wise.cat_id].name : ''

                var labl_name = "<div className='top-value' >"+row_wise.name+"</div><span className='dropdown-row'>"+row_wise.price+"|"+row_wise.cat_name+"</span>"
                var display_name    = row_wise.name
                var display_price   = row_wise.price
                var display_size    = row_wise.size
                var display_cat     = row_wise.cat_name
                
                item_api_info.push({label:row_wise.id, name:labl_name, display_name, display_price, display_size, varient_id, display_cat})

            }
            var ret_data = {}
            ret_data['dropdown'] = item_api_info

            return res.json({status:true, message:'Item List', type:'success', data:ret_data}) 
        }
    }

    async items(args=null){
        var where = {where:{enabled:'1'}, raw:true}
        if(args && args.hasOwnProperty('internal') && args.internal == 1)
        var where = {where:{enabled:'1', id:args.item_ids}, raw:true}

        return await db.item.findAll(where).then(result=>{
        return result
        }).catch(err=>{
            return false
        })

    }

    async category_dtl(args=null){
        var where = {where:{enabled:'1', id:args.cat_ids}, raw:true}

        var id_wise = {}
        await db.category.findAll(where).then(result=>{
            result.map(async row_wise=>{
            id_wise[row_wise.id] = row_wise
        
        })
        }).catch(err=>{
            return false
        })
        return id_wise

    }

    async list_fulfilment_station(req, res){
        const fulfil_station_obj= await (new Common).get_data('fulfilment_station',{'enabled':'1'})
        const prepared_time_obj = await (new Common).get_data('prepared_time',{'enabled':'1'})
        if(prepared_time_obj)
        {
            var data = {}
            data['list_fulfillment']= fulfil_station_obj.raw_data
            data['prepared_time']   = prepared_time_obj.raw_data

            return res.json({status:true, message:'Fulfillment station list', type:'success', data})
        }
        else
        {
            return res.json({status:false, message:'Some thing went wrong.', type:'error', data:null})
        }

    }

    async delete_records(args){
        var{table_name, where_condi} = args
        var where = {where:where_condi}
        return await db[table_name].destroy(where).then(result=>{
        return result
        }).catch(err=>{
        return false
        })
    }

    async upsert_record(table, data){
        try {
            const [record, created] = await db[table].upsert(data, { returning: true });
            if (created){
            console.log(`Record with id ${record.id} inserted.`);
            }else{
            console.log(`Record with id ${record.id} updated.`);
            }
            return data
        }catch(error){
            console.error('Error upserting record:', error);
            return false
        }
        return false
    }

}

module.exports = Item;
