var db = require('../models');
const { Op } = require("sequelize");

class Tag{

	async create_tag(req, res){
        var body_parse = req.body;
        var tags = JSON.parse(body_parse.name)
		var validateObj = app.formValidate(req, ['name']);
		if(!validateObj.status)
		return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


		var tag_obj  = await(new Tag).insert_tag({body_parse})
		if(tag_obj)
		return res.json({status:true, message:'Tag Added.', type:'success', data:tag_obj});
		else
		return res.json({status:true, message:'Some Error.', type:'success', data:[]});	
		
	}

	async insert_tag(args){
		var body_parse = args.body_parse
        var tags = JSON.parse(body_parse.name)
       
        if(tags.length)
        {
            var bulk_data = [];
            for(const row_wise of JSON.parse(body_parse.name))
            {
                var row = {}
                row['name'] = row_wise.name
                row['tag_type'] = 'tag'

                bulk_data.push(row)
            }
        }

        if(bulk_data.length>0)
        {
            return await db.tag.bulkCreate(bulk_data).then(result=>{
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

	async update_tag(req, res){
		var validateObj = app.formValidate(req, ['tag_id','action']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


		var body_parse = req.body
	
		var update_data = {}	
		if(body_parse.action == 'delete')
		update_data['enabled'] = '2'
		
		var where = {where:{id:body_parse.tag_id}};	

		db.tag.update(update_data,where).then(result=>{
            res.json({status:true, message:'success', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });
	}


	async list_tag(req, res, args=null){
		var where = {where:{enabled:'1'}, raw:true};
        var ret_type = args && args.tag_ids ? 1 : 0
        if(ret_type)
        where = {where:{enabled:'1', id:args.tag_ids}, raw:true};
		
		return await db.tag.findAll(where).then(data=>{
            var item_page = {}
            for(const val of data)
            {
                item_page[val.id] = val.name
            }
            if(ret_type)
            return item_page
            else
			res.json({status:true, message:'success', type:'success', data});
		}).catch(err=>{
            if(ret_type)
            return false
            else
			res.json({status:false, message:'error', data:err});
		})
	}

    async list_pref_tag_for_customer(req, res, args=null){
   		var where = {where:{enabled:'1', is_active:'1'}, raw:true};
        var ret_type = args && args.pref_tag_ids ? 1 : 0
        if(ret_type)
        where = {where:{enabled:'1', id:args.pref_tag_ids}, raw:true};

       	return await db.preference_tag.findAll(where).then(data=>{
			var api_data ={}; var item_page = {}
			for(const val of data)
			{
                val.img_mdfy = app.url+'/preference_tag_images/'+val.image
                item_page[val.id] = val

				if(api_data[val.preference_type])	
				api_data[val.preference_type].push(val)
				else
				api_data[val.preference_type] = [val]
			}

            if(ret_type)
            return item_page
            else
       		res.json({status:true, message:'success', type:'success', data:api_data});
         }).catch(err=>{
            if(ret_type)
            return false
            else
            res.json({status:false, message:'error', data:err});
        })
	}

	
	async list_pref_tag(req, res, args=null){
   		var where = {where:{enabled:'1'}, raw:true};
        var ret_type = args && args.pref_tag_ids ? 1 : 0
        if(ret_type)
        where = {where:{enabled:'1', id:args.pref_tag_ids}, raw:true};

       	return await db.preference_tag.findAll(where).then(data=>{
			var api_data ={}; var item_page = {}
			for(const val of data)
			{
                val.img_mdfy = app.url+'/preference_tag_images/'+val.image
                item_page[val.id] = val

				if(api_data[val.preference_type])	
				api_data[val.preference_type].push(val)
				else
				api_data[val.preference_type] = [val]
			}

            if(ret_type)
            return item_page
            else
       		res.json({status:true, message:'success', type:'success', data:api_data});
         }).catch(err=>{
            if(ret_type)
            return false
            else
            res.json({status:false, message:'error', data:err});
        })
	}	
		
    async search_tag(req, res){
        var validateObj = app.formValidate(req, ['name']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;


       var where = {where:{enabled:'1', name: {[Op.like]:`%${body_parse.name}%`}}}
       await db.tag.findAll(where).then(data=>{
           
        return res.json({status:true, message:'Refine Tag List ', type:'success', data});
       }).catch(err=>{
            return res.json({status:false, message:'Some thing went wrong', type:'error', data:err});
        });
    
    }

    async update_pref_tag(req, res){
       var body_parse = req.body
       var all_tags = body_parse.Allergen.concat(body_parse.Nutritional)
       console.log("all_tags== ", all_tags)

       var update_data = {}
       update_data['is_active'] = '1'


        var where = {where:{id:all_tags}};
        db.preference_tag.update(update_data,where).then(result=>{
            res.json({status:true, message:'Updated Successfully.', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });
    }


}

module.exports = Tag;
