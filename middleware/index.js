var db = require('../models');

const checkAuth = (req,res,next)=>{
    const jwt = require('jsonwebtoken');
    var {authorization} = req.headers;
    if(!authorization){
    authorization = req.query.Authorization;

      if(!authorization){
        authorization = req.body.Authorization;

      if(!authorization)
            return res.status(401).json({status:false,message:'Unauthorized access',data:req.query});
        }
  }
       var tokenArr = authorization.split(' ');
	if(tokenArr[0] != 'Bearer'){
        return res.status(404).json({status:false,message:'Not a valid token type',data:null});
     }
     var token = tokenArr.pop();

      jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        if (err) return res.status(401).send({ auth: false, message: 'Failed to authenticate token2.',err,token });


        req.tokenValue = decoded
        if(req.tokenValue && req.tokenValue.id)
        {
            isEnabled(req,res);

        }
	next();
    });

}

async function isEnabled(req,res){
    var db = require('../models');
    const [results, metadata] = await db.sequelize.query('select * from user where id=? and role_id=? and active=?',{ replacements: [req.tokenValue.id, '1','0']});
    if(results.length > 0)
    return res.status(200).json({status:false,message:'Inactive User',data:[]});
}


const formValidate = (req,res,next)=>{
    console.log("reqqq===", req.body, "param==", req.secparam);
    return res.status(200).json({status:true,message:'validation check',data:req.body});
}

module.exports = {checkAuth, formValidate};

