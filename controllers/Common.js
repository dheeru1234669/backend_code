var db              = require('../models');
var path            = require('path');
const { Op }        = require("sequelize");
const crypto        = require('crypto');
const moment        = require('moment-timezone');

class Common{

    async get_data(table_name, where){
        var where = {where, raw:true}
        try {
            var id_wise = {}; var raw_data = [];
            const data_obj = await db[table_name].findAll(where);
            if(data_obj)
            {
                for(const row_wise of data_obj)
                {
                    id_wise[row_wise.id] = row_wise
                }
            }
            var ret_data = {}
            ret_data['id_wise'] = id_wise
            ret_data['raw_data'] = data_obj

            return ret_data
        } catch (error){
            return false
        }

    }

    async get_data_with_or(table_name, where){
        var where = {where:{[Op.or]: where}}
        try {
            var id_wise = {}; var raw_data = [];
            const data_obj = await db[table_name].findAll(where);
            if(data_obj)
            {
                for(const row_wise of data_obj)
                {
                    id_wise[row_wise.id] = row_wise
                }
            }
            var ret_data = {}
            ret_data['id_wise'] = id_wise
            ret_data['raw_data'] = data_obj

            return ret_data
        } catch (error){
            return false
        }

    }

    async upsert_record(table, data){
        try {
            const [record, created] = await db[table].upsert(data, { returning: true });
            if (created){
                console.log(`Record with id ${record.id} inserted.`);
            }else{
                console.log(`Record with id ${record.id} updated.`);
            }
            return record
        }catch(error){
            console.error('Error upserting record:', error);
            return false
        }
        return false
    }

    async unique_number() {
        const randomBytes = crypto.randomBytes(6);
        const timestamp = Date.now().toString().slice(-6);
        const randomNumber = parseInt(randomBytes.toString('hex'), 16).toString().slice(-6);

        const uniqueNumber = timestamp + randomNumber;

        if (uniqueNumber.length < 13) {
            const extraRandomDigits = crypto.randomBytes(13 - uniqueNumber.length).toString('hex');
            return uniqueNumber + extraRandomDigits;
        }

        return uniqueNumber.slice(0, 13);
    }

    async upload_file(args){
       var {file_name, mdfy_name, upload_dir} = args
       const extensionName = path.extname(file_name.name);
       var modify_img_name = mdfy_name+''+extensionName
       file_name.mv('./uploads/'+upload_dir+'/' + modify_img_name);

       var ret_data = {}
       ret_data['modify_img_name'] = modify_img_name

       return ret_data

    }

    async valid_upload_files(args){
        var {file_name} = args
        const extensionName = path.extname(file_name.name);
        const file_size     = file_name.size
        const array_of_allowed_files = ['.png', '.jpeg', '.jpg', '.webp'];

        var ret_data = {}
        ret_data['msg'] = ''; ret_data['status'] = 1;
        if(!array_of_allowed_files.includes(extensionName))
        {
            ret_data['msg']     = 'Image not valid';
            ret_data['status']  = 0;
        }

        return ret_data;

    }

    async valid_upload_files_multiple(args){
        var {file_arr} = args
        const array_of_allowed_files = ['.png', '.jpeg', '.jpg', '.webp'];
        var ret_data = {}
        ret_data['msg'] = ''; ret_data['status'] = 1;

        if(typeof file_arr == 'object' && file_arr.length == 1)
        file_arr = [file_arr];

        if(file_arr.length)
        {
            for(const row_wise of file_arr)
            {
                const extensionName = path.extname(row_wise.name);
                const file_size     = row_wise.size

                if(!array_of_allowed_files.includes(extensionName))
                {
                   ret_data['msg']     = 'Image not valid';
                   ret_data['status']  = 0;
                   break;
                }
            }

        }
        return ret_data

    }

    async delete_records(table_name, where){
        var where = {where, raw:true}
        console.log("where", where)
        try{
        const deleted_count = await db[table_name].destroy(where);
        if(deleted_count)
        {
            var ret_data = {}
            ret_data['deleted_count'] = deleted_count
            return ret_data
        }
        } catch (error){
            return false
        }
    }

    async delete_not_in_records(args){
        var{table_name, item_id, ids} = args

        var where = {where:{
                            id: {
                                [Op.notIn]: ids
                        },
                        item_id:item_id
                        }
                    }
        

        return await db[table_name].destroy(where).then(result=>{
        return result
        }).catch(err=>{
        return false
        })
    }

    async days(){
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    }

    async get_current_time(){
        const now = new Date();
        now.setHours(now.getHours() + 5);
        now.setMinutes(now.getMinutes() + 30);
     
        var ret_data = {}
        ret_data['day_index']   = now.getDay();
        ret_data['hour']        = now.getHours();
        ret_data['minutes']     = now.getMinutes();
        ret_data['current_time']= now.getHours()+''+now.getMinutes()

        return ret_data;
    }

    async currency_icon(){
        return 'R';
    }

    async is_duplicate(args){
        var body_parse = args.body_parse
        var name_arr = JSON.parse(body_parse.name)
        var bulk_data = [];
        var duplicate_name = ''
        if(name_arr.length)
        {
            for(const row_wise of name_arr)
            {
                const tbl_obj = await (new Common).get_data([args.table_name],{'name':row_wise.name})
                if(tbl_obj.raw_data && tbl_obj.raw_data.length)
                {
                    if(body_parse.id && row_wise.name == tbl_obj.raw_data[0].name)
                    continue;

                    duplicate_name = row_wise.name
                    break;
                }
            }
        }
        var ret_data = {}
        ret_data['status'] = duplicate_name ? 1 : 0
        ret_data['name'] = duplicate_name
        
        return ret_data
    }

    async get_date_time(date_time){
        //const moment_obj = moment(date_time).tz('Asia/Kolkata');
        const moment_obj = moment(date_time, 'YYYY-MM-DD HH:mm:ss');
        const formatted_created_date = moment_obj.format('DD MMMM YYYY,HH:mm:ss');
        const date_time_get = moment_obj.format('YYYY-MM-DD,HH:mm:ss');
        const date_time_get_except_sec = moment_obj.format('YYYY-MM-DD,HH:mm');
        const date_and_time_mdfy = formatted_created_date.split(',');
        const date_and_time = date_time_get.split(',');
        const date_time_get_except_sec_mdfy = date_time_get_except_sec.split(',');

        var ret_data = {}
        ret_data['date_time']   = date_time_get
        ret_data['date_time_mdfy']= formatted_created_date
        ret_data['date']        = date_and_time[0]
        ret_data['time']        = date_and_time[1]
        ret_data['except_sec']  = date_time_get_except_sec_mdfy[1]
        ret_data['date_mdfy']   = date_and_time_mdfy[0]
        ret_data['time_mdfy']   = date_and_time_mdfy[1]

        return ret_data
    }
    async seconds_to_hms(seconds) {
        const duration = moment.duration(seconds, 'seconds');
        return moment.utc(duration.asMilliseconds()).format('HH:mm:ss');
    }

    async randum_number_pick(args){
        var arr = args.arr
        var random_index = Math.floor(Math.random() * arr.length);
        return arr[random_index];
    }
    

    
}

module.exports = Common;
