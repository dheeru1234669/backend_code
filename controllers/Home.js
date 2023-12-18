var db = require('../config/db.config.js')
var Common      = require('./Common');

class Home{
    
    async home_screen(req, res){
        var body_parse = req.body
        const theme_msg_obj = await (new Common).get_data('theme_msg',{'enabled':'1'})
        const theme_clr_obj = await (new Common).get_data('theme_color',{'enabled':'1'})
        if(theme_msg_obj)
        {
            theme_msg_obj.raw_data[0].theme = theme_clr_obj.raw_data[0]
            theme_msg_obj.raw_data[0].logo = app.url+'/theme_images/'+theme_clr_obj.raw_data[0].logo
            if(body_parse.parent)
            theme_msg_obj.raw_data[0].category = await (new Home).parent_category()

            return res.json({status:true, message:'Messages', type:'success', data:theme_msg_obj.raw_data[0]})
        }
        else
        {
            return res.json({status:false, message:'Some thing went wrong.', type:'error', data:null})
        }

    }

    async parent_category(){
        const category_obj = await (new Common).get_data('category',{'enabled':'1', 'parent':'0'})    
        if(category_obj.raw_data && category_obj.raw_data.length)
        {
            return category_obj.raw_data
        }
        return []
    }

    async theme(req, res){
        const theme_clr_obj = await (new Common).get_data('theme_color',{'enabled':'1'}) 
        if(theme_clr_obj)
        {
            theme_clr_obj.raw_data[0].logo = app.url+'/theme_images/'+theme_clr_obj.raw_data[0].logo
            return res.json({status:true, message:'Messages', type:'success', data:theme_clr_obj.raw_data[0]})
        }
        else
        {
            return res.json({status:false, message:'There is no data.', type:'warning', data:null})
        }
    }
}
module.exports = Home;
