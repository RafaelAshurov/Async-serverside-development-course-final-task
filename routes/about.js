const express = require('express');
const router = express.Router();

router.get('/',function(req,res,next){
	const developers = [
		{ firstname: 'Rafael', lastname: 'Ashurov', id: '312054711', email: 'raffyashurov@gmail.com' },
		{ firstname: 'Netanel', lastname: 'Braginsky', id: '205801160', email: 'netanlb@gmail.com' },
	];
	res.json(developers);
});

module.exports = router;
