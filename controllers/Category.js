//var db = require('../config/db.config.js')
var db = require('../models');
var path = require('path');
const crypto = require('crypto');
const Common = require('./Common');


class Category{

    async add_category(req, res){
        var body_parse = req.body;

        var validateObj = app.formValidate(req, ['name', 'header_type']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        //if(!req.files)
        if(body_parse.header_type == 'img' && (!req.files && !body_parse.preview_img))
        return res.json({status:false, message:'Image Required.', type:'warning', data:null});

        var is_validate = {}
        if(req.files)
        is_validate = await(new Common).valid_upload_files({file_name:req.files.cat_img})

        
        if(body_parse.day_wise && JSON.parse(body_parse.day_wise).length > 0)
        {
            var is_validate_days = await(new Category).validate_days(req, res)
            if(is_validate_days.msg)
            return res.json({status:false, message:is_validate_days.msg, type:'warning', data:null});   
        }
        
        var cat_upsert_obj   = await(new Category).category_upsert(req, res);

        if(cat_upsert_obj['status'] == 1)
        {
            if(req.files && is_validate.status == 1)
            {
                var upload_file_obj = await(new Common).upload_file({file_name:req.files.cat_img, mdfy_name:cat_upsert_obj['obj'].id, upload_dir:'cat_images'})
                if(upload_file_obj.modify_img_name)
                {
                    var where = {where:{id:cat_upsert_obj['obj'].id}};
                    var update_data = {image:upload_file_obj.modify_img_name}
                    const affected_row = await db.category.update(update_data,where) 

                }
            }

            if(body_parse.day_wise && JSON.parse(body_parse.day_wise).length > 0)
            {
                var time_base_visibility_obj = await(new Category).time_base_visibility({body_parse, cat_arg: cat_upsert_obj['obj']})       
            }

        }
            
        var message = body_parse.cat_uid ? 'Category Updated Successfully.' : 'Category Created Successfully.'            
        return res.json({status:true, message, type:'success', data:cat_upsert_obj['obj']});
        


    }

    async category_upsert(req, res){
        var body_parse = req.body;

        var insert_data = {};
        insert_data.cat_uid         = await (new Common).unique_number()
        insert_data.name            = body_parse.name
        insert_data.parent          = body_parse.parent ? body_parse.parent : '0';
        insert_data.header_type     = body_parse.header_type;

        if(body_parse.is_hidden)
        insert_data.is_hidden       = body_parse.is_hidden

        if(body_parse.is_enabled_time)
        insert_data.is_enabled_time = body_parse.is_enabled_time

        if(body_parse.cat_uid)
        {
            delete insert_data.cat_uid;
            delete insert_data.parent;

            var where = {where:{cat_uid:body_parse.cat_uid}, raw:true}

            const cat_obj = await db.category.findOne(where) 
            if(cat_obj && cat_obj.id)
            {
                const affectedRows = await db.category.update(insert_data, where);
                var ret_data = {status:1, msg:'Updated', obj:{id:cat_obj.id}}

                return ret_data;
            }
            
        }
        else
        {
        return await db.category.create(insert_data).then(result=>{
            var ret_data = {status:1, msg:'Created', obj:result}

			return ret_data
        }).catch(err=>{
            return false;
        });
        }
    
    }

    async validate_days(req, res){
        var body_parse = req.body;
        var is_uniq_day_name = {}; var daysName = app.daysName()
        var ret_data = {}; ret_data['msg'] = '';

        for(const row_wise of JSON.parse(body_parse.day_wise))
        {
            if(is_uniq_day_name[row_wise.day_name])
            {
                ret_data['msg'] = 'duplicate name '+ daysName[row_wise];
                break
            }
            else
            {
                is_uniq_day_name[row_wise.day_name] = row_wise
            }

            if(parseInt(row_wise.start_time) > parseInt(row_wise.end_time))
            {
                ret_data['msg'] = 'End Time should be greater in '+ daysName[row_wise.day_name]
                break
            }

        }
        return ret_data;
    }

    async time_base_visibility(args){
        var {body_parse, cat_arg} = args
        var visibility = JSON.parse(body_parse.day_wise)

        var bulk_data = [];

        visibility.map(async row_wise=>{
            var row = {}
            if(row_wise.id)
            row['id']       = row_wise.id

            row['cat_id']       = cat_arg.id
            row['day_name']     = row_wise.day_name
            row['start_time']   = row_wise.start_time
            row['end_time']     = row_wise.end_time

            bulk_data.push(row)
                    
            await(new Common).upsert_record('category_day_wise_enabled', row)

        })
        if(bulk_data.length>0)
        return bulk_data
        else
        return false
    }

	delete_category(req, res){
		var validateObj = app.formValidate(req, ['cat_uid']);
		if(!validateObj.status) 
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});	

		var update_data = {};
		update_data.enabled = '0'

		var {cat_uid} = req.body
		var where = {where:{cat_uid}};

		db.category.update(update_data,where).then(result=>{
                return res.json({status:true, message:'success', type:'success', data:update_data});
            }).catch(err=>{
                return res.json({status:false, message:'error', type:'error', data:err});
            });		
	}

    async get_category(req, res){
        var validateObj = app.formValidate(req, ['cat_uid'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null})

        var body_parse = req.body;
        var cat_obj = {}; var cat_timings_obj = [];
        var cat_info            = await(new Category).get_cat_info({body_parse})
        cat_info.image_mdfy     = app.url+'/cat_images/'+cat_info.image

        if(cat_info.is_enabled_time && cat_info.is_enabled_time == '1')
        cat_timings_obj     = await(new Category).get_cat_timings({body_parse, cat_info})

        cat_obj['db_cat_info']      = cat_info 
        cat_obj['db_cat_timings']   = cat_timings_obj
       
        return res.json({status:true, message:'Category Detail', type:'success', data:cat_obj});

        
    }

    async get_cat_info(args)
    {
        var body_parse = args.body_parse
        var where = {where:{cat_uid:body_parse.cat_uid}, raw:true};
        
        var cat_data = '';
        return await db.category.findOne(where).then(result=>{
        return result     
        }) 
        return false
    }

    async get_cat_timings(args)
    {
        var {body_parse, cat_info} = args
        var where = {where:{cat_id:cat_info.id}, raw:true};

        var visibility_arr = [];
        await db.category_day_wise_enabled.findAll(where).then(result=>{
            result.map(async row_wise=>{
                visibility_arr.push({id:row_wise.id, day_name:row_wise.day_name, start_time:row_wise.start_time, end_time:row_wise.end_time})
            })
        })
        var ret_data = {}
        ret_data['visibility_arr']  = visibility_arr
        return ret_data
    }

    async image_upload(req, res){

        const file_image = req.files;
        console.log("file_image== ", file_image)
        /*console.log("file_image== ", file_image);
        const file_size     = file_image.size
        console.log("file_size== ", file_size)

        return res.json({status:true, message:'success', type:'success', data:file_image});*/
    }



} //final bracket

module.exports = Category;
