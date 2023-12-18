var db          = require('../models');
const crypto    = require('crypto');
var path        = require('path');
var Common      = require('./Common');
const { Op }    = require("sequelize");

class Profile{

    async create_loc(req, res){
        var validateObj = app.formValidate(req, ['name','address_1','city','postal_code','state','country','phone_1','email']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        console.log("body_parse== ", body_parse)

        //if(req.files)
        if(1)
        {
            //var is_validate_days = await(new Profile).validate_image(req, res)

            var create_loction_obj = await(new Profile).create_loction_func(req, res)
            console.log("create_loction_obj: ", create_loction_obj.status)

            if(create_loction_obj)
            return res.json({status:true, message:'Location '+create_loction_obj.status+' successfully', type:'success', data:create_loction_obj});
            else
            return res.json({status:false, message:'Something went wrong', type:'error', data:null});
            
        }
        else
        {
            return res.json({status:false, message:'No files were uploaded..', type:'error', data:null});
        }

    }

    async create_loction_func(req, res){
        var body_parse = req.body
        var insert_data = {};

        var modify_img_name = ''
        if(req.files)
        {
            const d = new Date();
            let time = d.getTime();

            const file_image    = req.files.image
            const extensionName = path.extname(file_image.name)
            modify_img_name = time+''+extensionName

            file_image.mv('./uploads/loc_images/' + modify_img_name);

            insert_data['image'] = modify_img_name
        }

        insert_data['name'] = body_parse.name
        insert_data['address_1'] = body_parse.address_1
        insert_data['address_2'] = body_parse.address_2
        insert_data['address_3'] = body_parse.address_3
        insert_data['suburban'] = body_parse.suburban
        insert_data['city'] = body_parse.city
        insert_data['postal_code'] = body_parse.postal_code
        insert_data['state'] = body_parse.state
        insert_data['country'] = body_parse.country
        insert_data['phone_1'] = body_parse.phone_1
        insert_data['phone_2'] = body_parse.phone_2
        insert_data['email'] = body_parse.email

        if(body_parse.id)
        {
            var where = {where:{id:body_parse.id}}

            return await db.user_location.update(insert_data,where).then(result=>{
            result.status = 'updated'
            return result
            }).catch(err=>{
            return err
            }); 
        }
        else
        {
            return await db.user_location.create(insert_data).then(result=>{
            result.status = 'created'
            return result
            }).catch(err=>{
            })
        }

    }

    async validate_image(req, res){
        const file_image = req.files.image;
        const extensionName = path.extname(file_image.name)
        const file_size     = file_image.size
        const array_of_allowed_files = ['.png', '.jpeg', '.jpg']
        if(!array_of_allowed_files.includes(extensionName))
        return res.json({status:false, message:'Image type not valid.', type:'error', data:null});

        var size = 50 * 1024 * 1024
        if(file_size > size)
        return res.json({status:false, message:'Image size exceed.', type:'error', data:null})

        return true
   } 


    async list_location(req, res){
        const [results, metadata] = await db.sequelize.query('select * from user_locations where enabled  != ? order by id DESC', {replacements: ['2']});
        if(results)
        {
            for(const row_wise of results)
            {
                row_wise.img_mdfy = row_wise.image && row_wise.image != null ? app.url+'/loc_images/'+row_wise.image : app.url+'/loc_images/location-profile.PNG'
            }
            res.json({status:true, message:'List locations', type:'success', data:results});
        }
        else
        {
            res.json({status:false, message:'There is no data', type:'warning', data:[]});
        }
    
    }

    async profile_overview(req, res){

        var ret_data = {};
        ret_data['current_locations'] = await(new Profile).current_locations(req);
        ret_data['current_admins'] = 0
        ret_data['current_users'] = 0

        res.json({status:true, message:'Profile Overview', type:'success', data:ret_data});
    }

    async current_locations(req){
        const [results, metadata] = await db.sequelize.query('select count(*) as cnt from user_locations where enabled = ?', {replacements: ['1']}); 
        if(results && results.length > 0)
        return results[0].cnt
        else
        return 0
    }


    async create_user(req, res){
        var validateObj = app.formValidate(req, ['name','pass_code']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        const is_passcode_exist = await (new Common).get_data('user', {pass_code:body_parse.pass_code.trim()})
        console.log("is_passcode_exist", is_passcode_exist)
        if(is_passcode_exist.raw_data && is_passcode_exist.raw_data.length > 0)
        return res.json({status:false, message:'Passcode already exist.', type:'warning', data:null});


        var create_user_obj = ''
        create_user_obj = await(new Profile).create_user_func(req, res)

        
        
        if(create_user_obj)
        return res.json({status:true, message:body_parse.id ? 'User created successfully' :'User updated successfully', type:'success', data:create_user_obj});
        else
        return res.json({status:false, message:'Something went wrong', type:'warning', data:[]});

    }

    async create_user_func(req, res){
        var body_parse = req.body;
        console.log("body_parse162=", body_parse)
        var user_section = {}; var admin_dtl = {}; var insert_data = {}; 
        var main_section = null; var role_id = app.ROLE_USER;
        if(body_parse.user_section)
        {
            var user_section_parse = JSON.parse(body_parse.user_section)
            console.log("user_section_parse==", user_section_parse)
            if(user_section_parse.Loc)
            user_section['loc']         = user_section_parse.Loc     

            if(user_section_parse.Dash)
            user_section['dash']        = user_section_parse.Dash     

            if(user_section_parse.fulfilment)
            user_section['fulfilment']  = user_section_parse.fulfilment

            if(user_section_parse.Admin === true)
            role_id = app.ROLE_ADMIN
            else if(user_section_parse.Waiter === true)
            role_id = app.ROLE_WAITER

            main_section = user_section_parse.Dash_Main
        }

        if(body_parse.admin_detail)
        admin_dtl = JSON.parse(body_parse.admin_detail) 


        insert_data['name']     = body_parse.name
        insert_data['user_uid'] = await (new Common).unique_number()
        insert_data['email']    = admin_dtl.email
        insert_data['surname']  = body_parse.surname
        insert_data['pass_code']= body_parse.pass_code

        if(admin_dtl.password)
        insert_data['password'] = admin_dtl.password

        insert_data['location_id'] = body_parse.location_id
        insert_data['role_id'] = role_id

        if(body_parse.user_section)
        insert_data['user_section'] = JSON.stringify(user_section)

        if(admin_dtl.admin_section)
        insert_data['admin_section'] = JSON.stringify(Object.keys(admin_dtl.admin_section))

        insert_data['main_section'] = main_section

        insert_data['name_bg_color'] = await (new Common).randum_number_pick({arr:app.waiter_bg_color()})

        if(body_parse.waiter_detail)
        {
            var waiter_detail = JSON.parse(body_parse.waiter_detail)
            if(waiter_detail.email)
            insert_data['email'] = waiter_detail.email

            if(waiter_detail.password)
            insert_data['password'] = waiter_detail.password

            if(waiter_detail.mobile)
            insert_data['mobile'] = waiter_detail.mobile

            if(waiter_detail.passport)
            insert_data['passport_no'] = waiter_detail.passport

        }
        console.log("insert_data_dmin:", insert_data)

        if(body_parse.id)
        {
            delete insert_data.user_uid

            var where = {where:{id:body_parse.id}}

            db.user.update(insert_data,where).then(result=>{
            return result
            }).catch(err=>{return err});
        }
        else
        {
            return await db.user.create(insert_data).then(result=>{
            return result
            }).catch(err=>{})
        }
    }

    async update_user_func(req, res){
        var body_parse = req.body;

        var update_data = {}
        update_data['name'] = body_parse.name
        update_data['surname'] = body_parse.surname
        update_data['location_id'] = body_parse.location_id
        update_data['page_ids'] = JSON.stringify(body_parse.page_ids)

        var where = {where:{id:body_parse.id}}

        db.user.update(update_data,where).then(result=>{
        return result
        }).catch(err=>{
        return err
        });

    }

    async list_user(req, res){
        const [results, metadata] = await db.sequelize.query('select * from users where enabled  != ? order by id DESC', {replacements: ['2']});
        if(results)
        {
            const admin_section_obj = await (new Common).get_data('admin_section',{'enabled':'1'})
            const pages_obj         = await (new Common).get_data('page',{'enabled':'1'})
            const user_loc_obj      = await (new Common).get_data('user_location',{'enabled':'1'})
            for(const row_wise of results)
            {
                row_wise.role = row_wise.role_id == 1 ? 'Admin' : 'User'
                row_wise.status = row_wise.enabled == 1 ? 'Acitve' : 'In Active'

                var str = row_wise.name+' '+row_wise.surname;
                var matches = str.match(/\b(\w)/g);
                var admin_section = row_wise.admin_section ? JSON.parse(row_wise.admin_section) : ''
                var admin_section_name = '';
                for(const inner_row of admin_section)
                {
                    admin_section_name += admin_section_obj.id_wise[inner_row].name+', '    
                }
                admin_section_name = admin_section_name.replace(/,\s*$/, "");

                var user_section_parse = JSON.parse(row_wise.user_section)

                var loc_section_name = ''; var loc_arr = [];
                if(user_section_parse && user_section_parse.loc)
                {
                    for(const inner_row of user_section_parse.loc)
                    {
                        if(pages_obj.id_wise && user_loc_obj.id_wise[inner_row])
                        loc_section_name += user_loc_obj.id_wise[inner_row].name+', '

                        loc_arr.push(parseInt(inner_row))
                    }
                
                    loc_section_name = loc_section_name.replace(/,\s*$/, "")
                }

                var dashboard_section_name = ''; var dash_arr = [];
                if(user_section_parse && user_section_parse.dash)
                {
                    for(const inner_row of user_section_parse.dash)
                    {
                        if(pages_obj.id_wise && pages_obj.id_wise[inner_row])
                        dashboard_section_name += pages_obj.id_wise[inner_row].name+', '

                        dash_arr.push(parseInt(inner_row))
                    }
                
                    dashboard_section_name = dashboard_section_name.replace(/,\s*$/, "")
                }

                var fulfil_arr = [];
                if(user_section_parse && user_section_parse.fulfilment)
                {
                    for(const inner_row of user_section_parse.fulfilment)
                    {
                        fulfil_arr.push(parseInt(inner_row))
                    }
                }
                
                row_wise.short_name = matches.join('').toUpperCase()
                row_wise.locations  = loc_section_name;
                row_wise.loc_ids  = loc_arr;
                row_wise.dash_ids  = dash_arr;
                row_wise.fulfillment_ids  = fulfil_arr;
                row_wise.dashboard_admin_section = dashboard_section_name+', '+admin_section_name
            }
            res.json({status:true, message:'List users', type:'success', data:results});
        }
        else
        {
            res.json({status:false, message:'There is no data', type:'warning', data:[]});
        }
    
    }

    async pages(req, res, flag=0){
        var where = {where:{enabled:'1'}, order: [['id', 'DESC'],], raw:true};

        return await db.page.findAll(where).then(data=>{
        return res.json({status:true, message:'success', type:'success', data});

        }).catch(err=>{
        return res.json({status:false, message:'error', type:'error', data:err});
        });
    }

    async user_info(req, res){
        var validateObj = app.formValidate(req, ['user_id']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body

        var where = {where:{id:body_parse.user_id}, raw:true}
        await db.user.findOne(where).then(result=>{
        return res.json({status:true, message:'user info', type:'success', data:result});
        }).catch(err=>{
            return res.json({status:false, message:err, type:'success', data:[]});
        })

    }

    async create_fulfilment_station(req, res){
		var validateObj = app.formValidate(req, ['name']);
		if(!validateObj.status)
		return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

		var body_parse = req.body;

		var fulfilment_obj  = await(new Profile).insert_fulfilment({body_parse})
		if(fulfilment_obj)
		return res.json({status:true, message:'fulfilment station Added.', type:'success', data:fulfilment_obj});
		else
		return res.json({status:true, message:'Some Error.', type:'success', data:[]});	
		
	}   

    async insert_fulfilment(args){
		var body_parse = args.body_parse

		var insert_data = {}
		insert_data['name'] 	= body_parse.name

		return await db.fulfilment_station.create(insert_data).then(result=>{
        	return result
        }).catch(err=>{
            return false;
        });		
	}

    async update_fulfilment_station(req, res){
		var validateObj = app.formValidate(req, ['id','action']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


		var body_parse = req.body
	
		var update_data = {}	
		if(body_parse.action == 'delete')
		update_data['enabled'] = '2'
	
        if(body_parse.name)
        update_data['name'] = body_parse.name

		var where = {where:{id:body_parse.id}};	

		db.fulfilment_station.update(update_data,where).then(result=>{
            res.json({status:true, message:'success', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });
	}

    async list_fulfilment_station(req, res){
		var where = {where:{enabled:'1'}, raw:true};
		
		db.fulfilment_station.findAll(where).then(data=>{
			res.json({status:true, message:'success', type:'success', data});
		}).catch(err=>{
			res.json({status:false, message:'error', data:err});
		})
	}

    async admin_section(req, res, flag=0){
        var where = {where:{enabled:'1'}, order: [['id', 'ASC'],], raw:true};

        return await db.admin_section.findAll(where).then(data=>{
        return res.json({status:true, message:'success', type:'success', data});

        }).catch(err=>{
        return res.json({status:false, message:'error', type:'error', data:err});
        });
    }
}

module.exports = Profile;
