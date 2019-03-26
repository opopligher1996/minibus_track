net = require('net');
var request = require('request');

// Keep track of the chat clients
var clients = [];

// Start a TCP Server
net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 

  // Put this new client in the list
  clients.push(socket);

  // Send a nice welcome message and announce
  socket.write("Welcome " + socket.name + "\n");
  broadcast(socket.name + " joined the chat\n", socket);

  // Handle incoming messages from clients.
  socket.on('data', function (data) {
	console.log('data.toString()');
	var d = data.toString();
	var split_d = d.split(')');
	split_d.forEach(function(record) {
		var minibus_info = record.split(',');
		var method = minibus_info[1];
		if(method == "DW50"){
			console.log("Enter DW50");
			var string_time = minibus_info[ minibus_info.length - 1];
			var string_hour = string_time.substring(0,2);
			var string_minute = string_time.substring(2,4);
			var string_second = string_time.substring(4,6);
                        var date = new Date();
                        date.setHours(parseInt(string_hour)+8);
                        date.setMinutes(parseInt(string_minute));
                        date.setSeconds(parseInt(string_second));
			var d_timestamp = date.getTime();
			console.log(record);
			console.log(string_time);
			var wifi_count = parseInt(minibus_info[6]);
			var wifi_strings = [];
			for( var i = 0; i < wifi_count; i++ ){
				wifi_strings.push(minibus_info[7+i]);
			}
			console.log("wifi_strings");
			console.log(wifi_strings);
			
			if(wifi_count != 0)
			{
				console.log("!=0");
				request.post(
					'http://staging.socif.co:3002/api/v2/record/addLocationRecord',
					{ json: {location: "{\"lat\":0,\"lng\":0}", license: "Box", route: "11", provider: "wifi", wifi: wifi_strings, timestamp: d_timestamp.toString() } },
					function (error, response, body) {
                                       		if(!error && response.statusCode == 200){
                                                	console.log(body);
                                        	}
                                	}
				);
			}
		}
		else if(method == "DW30"){
			console.log("Enter DW30");
			var string_time = minibus_info[7];
			var string_lat = minibus_info[4];
			var string_lon = minibus_info[5];
			var string_speed = minibus_info[6];
			var string_hour = string_time.substring(0,2);
			var string_minute = string_time.substring(2,4);
			var string_sec = string_time.substring(4,6);
			string_lat = string_lat.substring(0,string_lat.length-1);
			string_lon = string_lon.substring(0,string_lon.length-1);
			var lat = parseFloat(string_lat.substring(0,2)) + parseFloat(string_lat.substring(2,string_lat.length))/60;
			var lon = parseFloat(string_lon.substring(0,3)) + parseFloat(string_lon.substring(3,string_lon.length))/60;
			var date = new Date();
			date.setHours(parseInt(string_hour)+8);
			date.setMinutes(parseInt(string_minute));
			date.setSeconds(parseInt(string_sec));
			var d_timestamp = date.getTime();
			request.post(
				'http://staging.socif.co:3002/api/v2/record/addLocationRecord',
				{ json: {location: "{\"lat\":"+ lat.toString() +", \"lng\": "+ lon.toString()+ "}", license: "Box", route: "11", timestamp: d_timestamp.toString(), speed: string_speed, batteryLeft: "101", provider: "gps", accuracy: "0" } },
				function (error, response, body) {
					if(!error && response.statusCode == 200){
						console.log(body);
					}
				}
			);
		}
	});	
	console.log(split_d);
	console.log('end');
	
	
	//request.post(
	//	'http://staging.socif.co:3002/api/v2/record/addLocationRecord',
	//	{ json: {location: "{\"lat\": 0, \"lng\":0}", license: "Box", route: "11", timestamp: "111546697225965", batteryLeft: "101"} },
	//	function (error, response, body) {
	//		if(!error && response.statusCode == 200) {
	//			console.log(body);
	//		}
	//	}
	//);	
	//http://production.socif.co:3002/api/v2/record/addLocationRecord;
    broadcast(socket.name + "> " + data, socket);
  });

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left the chat.\n");
  });
  
  // Send a message to all clients
  function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message);
    });
    // Log it to the server output too
    process.stdout.write(message)
  }

}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000\n");
