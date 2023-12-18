var db = require('../config/db.config.js')

class Login{
	login(req, res){
		var {email,password} = req.body;
		
		if(!email || !password)
        return res.status(400).json({status:false, message:'email and password required', data:null});

		var sql = 'SELECT * FROM user WHERE email = ? and password = ? and role_id = ?'

		db.query(sql, [ email, password, 1], function (err, result) {
			if(err)
			return res.json({status:false, message:'error', type:'error', data:err});	

			if(!result.length)
			return res.json({status:false, message:'Wrong credential', type:'error', data:[]});
		
			if(result.length)
			{
				var data = result[0]
				var token = app.token({id:data.id});
				data.token = token
				delete data.password
				res.json({status:true, message:'User Dtl', type:'success', data});	
			}
			
		})	
		
	}
}

module.exports = Login;
