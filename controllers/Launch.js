var db = require('../config/db.config.js')

class Launch{
	launchScreen(req, res){
	var {email, password} = req.body;
	var password = '1234'
	var sql = 'SELECT * FROM user WHERE password = ?';
	db.query(sql, [password], function (err, result) {
  		if(err)
		return res.json({status:false, message:'error', type:'error', data:err});
		
		if(result)
		{
			var ret_data = result[0]
			var token = app.token({id:ret_data.id});
			ret_data.token = token
	
			res.json({status:true, message:'User Dtl', type:'success', data:ret_data});
		}
	});
	}
}

module.exports = Launch;
