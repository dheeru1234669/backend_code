var db = require('../models');
const crypto = require('crypto');
var path            = require('path');
const { Op }            = require("sequelize");

class Theme{
    
    async list_theme_color(req, res){
       var where = {where:{enabled:'1'}, raw:true} 

       await db.theme_color.findAll(where).then(data=>{
            for(const row_wise of data)
            {
                row_wise.img_mdfy = app.url+'/theme_images/'+row_wise.logo
            }
        return res.json({status:true, message:'Theme color ', type:'success', data:data[0]});
       }).catch(err=>{
        return res.json({status:false, message:'Some thing went wrong', type:'error', data:err});
       })
    }

    async theme_color(req, res){
        var validateObj = app.formValidate(req, ['bgcolor', 'cardbg', 'textlines', 'btncolor', 'btntext']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null}); 

        //if (!req.files)
        //return res.json({status:false, message:'Image is required.', type:'error', data:null});

        if(req.files)
        var is_validate_img = await(new Theme).validate_image(req, res)

        var insert_theme_color_obj = await(new Theme).insert_theme_color(req, res)

        return res.json({status:true, message:'Updated Succesfully', type:'success', data:insert_theme_color_obj});

    }

    async insert_theme_color(req, res){
       var body_parse = req.body
       console.log("body_parse== ", body_parse)

        var modify_img_name = ''
        if(req.files)
        {
            const d = new Date()
            let time = d.getTime()
            const file_image    = req.files.logo
            const extensionName = path.extname(file_image.name)
            var modify_img_name = time+''+extensionName

            file_image.mv('./uploads/theme_images/' + modify_img_name);
        }


        var insert_data = {}
        insert_data['bgcolor']      = body_parse.bgcolor
        insert_data['cardbg']       = body_parse.cardbg
        insert_data['textlines']    = body_parse.textlines
        insert_data['btncolor']     = body_parse.btncolor
        insert_data['btntext']      = body_parse.btntext
        if(modify_img_name)
        insert_data['logo']         = modify_img_name

        if(body_parse.id)
        {
            var where = {where:{id:body_parse.id}}
            return await db.theme_color.update(insert_data, where).then(result=>{
            return result
            }).catch(err=>{return false});
        }
        else
        {
        return await db.theme_color.create(insert_data).then(result=>{
        return result
        }).catch(err=>{
        return false
        });
        }
    }


    async validate_image(req, res){
        const file_image = req.files.logo;
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


   async get_theme_msgs(req, res){
       var where = {where:{enabled:'1'}, raw:true} 

       await db.theme_msg.findAll(where).then(data=>{
        return res.json({status:true, message:'Theme color ', type:'success', data:data[0]});
       }).catch(err=>{
        return res.json({status:false, message:'Some thing went wrong', type:'error', data:err});
       })
    }

    async insert_theme_msg(req, res){
        var validateObj = app.formValidate(req, ['welcome_msg','welcome_msg_desc','land_page_msg','order_conf_1','order_conf_2','order_conf_3','order_conf_4','order_rec_1','order_rec_2','order_rec_3','order_rec_4','call_order_rec_1','call_order_rec_2']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});
 
        var body_parse = req.body
            if(body_parse.id)
            {   
                var where = {where:{id:body_parse.id}}
                await db.theme_msg.update(body_parse, where).then(result=>{
                return res.json({status:true, message:'Updated Theme Msg successfully.', type:'success', data:result});
                }).catch(err=>{
                    return res.json({status:false, message:'Some thing went wrong', type:'error', data:err});
                });
            }
            else
            {
                await db.theme_msg.create(body_parse).then(result=>{
                return res.json({status:true, message:'Create Theme Msg', type:'success', data:result});
                }).catch(err=>{
                    return res.json({status:false, message:'Theme Msg', type:'error', data:null});
                });
            }
    
    }


}

module.exports = Theme;
