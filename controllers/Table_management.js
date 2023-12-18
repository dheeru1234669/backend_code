var db          = require('../models');
const crypto    = require('crypto');
const { Op, Sequelize}    = require("sequelize");
const QRCode    = require('qrcode');
const fs        = require('fs');
var Common      = require('./Common');

class Table_management{
   
    async overview(req, res){
        const [results, metadata] = await db.sequelize.query('select count(*) as cnt from tables  where enabled =?', {replacements: ['1']}); 
        const [results_t, metadata_t] = await db.sequelize.query('select count(*) as cnt from zones where enabled =?', {replacements: ['1']}); 
        var data = {}
        data['total_zone']  = results_t && results_t[0].cnt
        data['total_table'] = results && results[0].cnt
        
       return res.json({status:true, message:'details', type:'success', data});

    }

    async create_zone(req, res){
        var validateObj = app.formValidate(req, ['name']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;
        var zone_obj = ''

        var is_exist  = await(new Common).is_duplicate({table_name:'zone', body_parse})
        if(is_exist.status == 1)
        return res.json({status:false, message:is_exist.name+''+' already exist.', type:'warning', data:[]});

        if(body_parse.id)
        zone_obj  = await(new Table_management).update_zone({body_parse})
        else
        zone_obj  = await(new Table_management).insert_zone({body_parse})

        if(zone_obj)
        return res.json({status:true, message: body_parse.id ? ' Zone Updated' : 'Zone Added', type:'success', data:zone_obj});
        else
        return res.json({status:false, message:'Some Error.', type:'error', data:[]});
    }

    async insert_zone(args){
		var body_parse = args.body_parse
        var zones = JSON.parse(body_parse.name)

        if(zones.length)
        {
            var bulk_data = [];
            for(const row_wise of JSON.parse(body_parse.name))
            {
                var row = {}
                row['name'] = row_wise.name

                bulk_data.push(row)
            }
        }

        if(bulk_data.length>0)
        {
            return await db.zone.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            });
        }
	}

    async update_zone(args){
		var body_parse = args.body_parse
        var zones = JSON.parse(body_parse.name)

		var update_data = {}
		update_data['name'] 	= zones[0].name

        var where = {where:{id:body_parse.id}};

		return await db.zone.update(update_data,where).then(result=>{
        	return result
        }).catch(err=>{
            return false;
        });		
	}

    async list_zone(req, res, inner_call=0){
        var where = {where:{enabled:'1'}, raw:true};
        var id_wise = {};

        return await db.zone.findAll(where).then(data=>{
            if(inner_call == 1)
            {
                data.map(async row_wise=>{
                    id_wise[row_wise.id] = row_wise
                })
                return id_wise
            }
            res.json({status:true, message:'success', type:'success', data});
        }).catch(err=>{
             res.json({status:false, message:'error', data:err});
        })
    }

    async delete_zone(req, res){
		var validateObj = app.formValidate(req, ['zone_id','action']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


		var body_parse = req.body
	
		var update_data = {}	
		if(body_parse.action == 'delete')
		update_data['enabled'] = '2'
		
		var where = {where:{id:body_parse.zone_id}};	

		db.zone.update(update_data,where).then(result=>{
            res.json({status:true, message:'success', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });
	}

    async create_table(req, res){
        var validateObj = app.formValidate(req, ['name']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;

        console.log("body_parse=== ", body_parse)
        var is_exist  = await(new Common).is_duplicate({table_name:'table', body_parse})
        if(is_exist.status == 1)
        return res.json({status:false, message:is_exist.name+''+' already exist.', type:'warning', data:[]});


        var max_table_no    = await Table_management.max_table_no()

        var tbl_obj = {}
        if(body_parse.id)
        tbl_obj  = await(new Table_management).update_table({body_parse})
        else
        tbl_obj  = await(new Table_management).insert_table({body_parse, max_table_no})

        if(tbl_obj)
        return res.json({status:true, message: body_parse.id ? 'Table Updated' : 'Table Added', type:'success', data:tbl_obj});
        else
        return res.json({status:true, message:'Some Error.', type:'success', data:[]});
        

    }

    static async max_table_no()
    {
        var res = 0;
        await db.table.findOne({
        attributes: [[Sequelize.fn('max', Sequelize.col('table_no')), 'table_no']],
        raw:true
        }).then(result=>{
            res = result.table_no ? result.table_no : 0;
        }).catch(err=>{
        });
        return res;
    }


    async is_exist_table_no(args){
        var body_parse = args.body_parse
        
        var table_name = body_parse.name.trim()
        var where = {where:{name:table_name}, raw:true};
        var res = 0
        await db.table.findOne(where).then(result=>{
        res = result.name
        }).catch(err=>{
        res = 0
        })

        return res
    }

    async qrcode_generator(req, res){
        var validateObj = app.formValidate(req, ['id']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});

        var body_parse = req.body;

        var data = {}
        data['id'] = body_parse.id
        const dataToEncode = JSON.stringify(data)

        const file_name = body_parse.id+'.svg'
        const upload_path = 'uploads/qrcode/'+file_name

        var ret_dataa = QRCode.toFile(
            upload_path,
            dataToEncode,
            {
                errorCorrectionLevel: 'H', // Error correction level (L, M, Q, H)
                width: 300,
            },
            (err) => {
            if (err) {
            return res.json({status:false, message:err, type:'warning', data:null}); 
            } else {
                var where = {where:{id:body_parse.id}}
                var update_data = {}
                update_data['qrcode'] = file_name
                db.table.update(update_data,where).then(result=>{
                var qrcode_url = app.url+'/qrcode/'+file_name
                return res.json({status:true, message: 'QR CODE genereated.', type:'success', data:qrcode_url});
                }).catch(err=>{
                return false
                })
            }
            }
        );
        return ret_dataa
    }

    async insert_table(args){
        var body_parse  = args.body_parse
        var max_table_no= args.max_table_no

        var tbls = JSON.parse(body_parse.name)
        if(tbls.length)
        {
            var bulk_data = [];
            var cnt = 0
            for(const row_wise of JSON.parse(body_parse.name))
            {
                var row = {}
                cnt++
                row['table_uid'] = await (new Common).unique_number()
                row['table_no'] = max_table_no + cnt;
                row['name']     = row_wise.name
                row['zone_id']  = row_wise.zone_id

                bulk_data.push(row)
            }
        }

        if(bulk_data.length>0)
        {
            return await db.table.bulkCreate(bulk_data).then(result=>{
            return result
            }).catch(err=>{
            return false;
            });
        }
        
    }

    async update_table(args){
		var body_parse = args.body_parse
        var tbl = JSON.parse(body_parse.name)

		var update_data = {}
		update_data['name'] 	= tbl[0].name
		update_data['zone_id'] 	= tbl[0].zone_id

        var where = {where:{id:body_parse.id}};

		return await db.table.update(update_data,where).then(result=>{
        	return result
        }).catch(err=>{
            return false;
        });		
	}

    async delete_table(req, res){
		var validateObj = app.formValidate(req, ['table_id','action']);
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null});


		var body_parse = req.body
	
		var update_data = {}	
		if(body_parse.action == 'delete')
		update_data['enabled'] = '2'
		
		var where = {where:{id:body_parse.table_id}};	

		db.table.update(update_data,where).then(result=>{
            res.json({status:true, message:'success', type:'success', data:update_data});
        }).catch(err=>{
            res.json({status:false, message:'error', type:'error', data:err});
        });
	}

    async list_table(req, res, flag=null){
        var where = {where:{enabled:'1'}, raw:true};

        var zone_id_wise    = await(new Table_management).list_zone(req, res, 1)
        var status_id_wise  = await(new Table_management).table_status_name(req, res, 1)


        return await db.table.findAll(where).then(data=>{
            data.map(async row_wise=>{
                row_wise.zone_name = (zone_id_wise[row_wise.zone_id]) ? zone_id_wise[row_wise.zone_id].name : ''
                row_wise.status_name = status_id_wise['ID_WISE'][row_wise.status] ? status_id_wise['ID_WISE'][row_wise.status] : '';
                row_wise.table_status_color = status_id_wise['ID_WISE'][row_wise.status] ? status_id_wise['ID_WISE'][row_wise.color] : '';


            })
            if(flag == 1)
            return data
            else
            return res.json({status:true, message:'success', type:'success', data});

        }).catch(err=>{
            if(flag == 1)
            return false
            else
            return res.json({status:false, message:'error', data:err});
        }) 
    }


    async table_status_name(req, res, flag=null){
        var where = {where:{enabled:'1'}, raw:true};
        var id_wise = {}
        await db.table_status_name.findAll(where).then(data=>{
            if(flag == 1)
            {
                data.map(async row_wise=>{
                    id_wise[row_wise.id] = row_wise
               })

            }
            else
            {
                return res.json({status:true, message:'success', type:'success', data});
            }
        }).catch(err=>{
            if(flag == 1)
            return false
            else
            return res.json({status:false, message:'error', data:err});
        })

        if(flag == 1)
        {
            var api_data = {}
            api_data['ID_WISE'] = id_wise
            return api_data
        }
    }

    async update_table_status(req, res){
        var validateObj = app.formValidate(req, ['id', 'status'])
        if(!validateObj.status)
        return res.json({status:false, message:validateObj.msg, type:'warning', data:null})

        var body_parse = req.body;
        var update_data = {};
        update_data['status'] = body_parse.status

        var where = {where:{id:body_parse.id}}

        db.table.update(update_data,where).then(result=>{
        return res.json({status:true, message:'success', type:'success', data:update_data});
        }).catch(err=>{
        return res.json({status:false, message:'error', type:'error', data:err});
        });

    }
}

module.exports = Table_management;
