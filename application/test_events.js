var EventsD = require('../lib/eventsd.js'),
	EventsD_client = new EventsD();

var idx = 0;
while(idx++<100) {
	if(Math.random() < 0.25) {
		EventsD_client.send("app.test.success",{"data1":"things","data2":"other things"});
	} else if(Math.random() > 0.75) {
		EventsD_client.send("app.test.failure",{"data1":"things","data2":"other things"});
	} else {
		EventsD_client.send("app.dashboard_reports.process.error",{"data1":"things","data2":"other things"});
	}
}

