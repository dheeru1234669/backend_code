var app = {};

app.token = (store, expiresIn = null)=> {
	const jwt = require('jsonwebtoken');
	let token = null;
	if(expiresIn != null)
        token = jwt.sign(store, process.env.TOKEN_SECRET,expiresIn);
    else
         token = jwt.sign(store, process.env.TOKEN_SECRET);

    return token;
}

app.checkToken = (req,res,run)=>{
    const jwt = require('jsonwebtoken');
      var token = req.headers['token'] | req.body.token;
      if (!token) return res.status(401).send({ auth: false, message: 'No token provided.' });

      jwt.verify(token, process.env.TOKEN_SECRET, function(err, decoded) {
        if (err) return res.status(500).send({ auth: false, message: 'Failed to authenticate token1.' });

        run(err,decoded);
      });

}
	


app.modifyDate = (args)=>{
    //var splitDate = '03/20/2023'; //args.date.split('/') //m/d/y
    var splitDate = args.date.split('/') //m/d/y
    var modifyDate = splitDate[2]+'-'+splitDate[0]+'-'+splitDate[1]
    return modifyDate
}

app.formValidate = (req,inputs)=>{
	var body = req.body;
	var status = true; var msg=[];
	for (const property in inputs) {
		var key = inputs[property];
		if(!body[key])
        {
            status = false;
            msg.push(`${key} is required.`);
        }
	}
	return {status, msg};	
}

app.daysName = ()=>{
    var day_arr = {1:'Monday', 2:'Tuesday', 3:'Wednesday', 4:'Thrusday', 5:'Friday',6:'Saturday',7:'Sunday','8':'All Day'}

    return day_arr;

}

app.payment_mode = ()=>{
    var mode = {1:'Pay Afterwards'}
    return mode
}

app.order_status = ()=>{
    var status_name = {1:'Start', 2:'Confirm', 3:'Complete', 4:'Completed', 5:'Cancel', 6:'Paid', 7:'Redy To Deliver'}
    return status_name
}

app.order_status_constant = ()=>{
    var status_constant = {New:1, Confirm:2, Complete:3, Completed:4, Cancel:5, Paid:6, Ready_to_deliver:7}
    return status_constant
}

app.order_status_change_after_update = ()=>{
    return {1:2, 2:3, 3:4}
}

app.roles = ()=>{
    var name = {1:'Admin', 2:'User', 3:'Waiter'}
    return name
}

app.restaurent_name = ()=>{
    var name = {1:'Legends'}
    var name = 'Legends'
    return name
}

app.waiter_bg_color = ()=>{
    var colors = ['vived-red','yellow-btn','Navy-Blue','sky-blue','Celestial-Dragon','orange-bg','hard-blue','bg-green','Cyberpink','light-yellow','cool-yellow','dark-perpal','light-sky-bg','dark-sky-bg','bg-geru','bg-kathai','bg-green','text-color','text-pink','text-green','bg-light-green','bg-light-gray']
    return colors
}

app.WAITER_MANAGER = 7
app.TABLE_MANAGEMENT = 5

app.ROLE_USER = 2
app.ROLE_WAITER = 3
app.ROLE_ADMIN = 1

app.url='http://rms.softreader.in:5000'

//for app object global in server
global.app = app;

module.exports = global.app;


