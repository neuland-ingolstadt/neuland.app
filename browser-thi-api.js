function thiAppRequest(params)
{
	function ab2str(buf)
	{
		return String.fromCharCode.apply(null, new Uint8Array(buf));
	}

	function str2ab(str) {
		var buf = new ArrayBuffer(str.length);
		var bufView = new Uint8Array(buf);
		for (var i=0, strLen=str.length; i<strLen; i++)
		{
			bufView[i] = str.charCodeAt(i);
		}
		return buf;
	}

	var paramList = [];
	for(var key in params)
		paramList.push(key + "=" + encodeURIComponent(params[key]));
	
	var options = {
		method: "POST",
		path: "/webservice/production2/index.php",
		body: paramList.join("&"),
		headers: {
			"Host": "hiplan.thi.de",
			"Content-Type": "application/x-www-form-urlencoded",
			"User-Agent": "Better THI-App https://github.com/M4GNV5/THI-App",
		},
	};

	var request = forge.http.createRequest(options);
	var buffer = forge.util.createBuffer();
	var response = forge.http.createResponse();

	var resolveResult = null;
	var rejectResult = null;
	var resultPromise = new Promise(function(resolve, reject)
	{
		resolveResult = resolve;
		rejectResult = reject;
	});

	var client = forge.tls.createConnection({
		server: false,
		verify: function(connection, verified, depth, certs)
		{
			// TODO
			return true;
		},
		connected: function(connection)
		{
			client.prepare(request.toString() + request.body);
		},
		tlsDataReady: function(connection)
		{
			var data = connection.tlsData.getBytes();
			socket.send(str2ab(data));
		},
		dataReady: function(connection)
		{
			// clear data from the server is ready
			var data = connection.data.getBytes();
			if(response.bodyReceived)
				return;
			
			buffer.putBytes(data);
			if(!response.headerReceived)
			{
				response.readHeader(buffer);
			}
			
			if(response.headerReceived)
			{
				if(response.readBody(buffer))
				{
					console.log(response.body);
					try
					{
						var data = JSON.parse(response.body);
					}
					catch(e)
					{
						rejectResult(e);
						return;
					}

					resolveResult(data);
					client.close();
				}
			}
		},
		closed: function()
		{
			socket.close();
		},
		error: function(connection, error)
		{
			rejectResult(error);
		}
	});

	var socket = new WebSocket("ws://localhost:8080");
	socket.binaryType = "arraybuffer";
	socket.addEventListener('open', function(event)
	{
		client.handshake();
	});
	socket.addEventListener('message', function(event)
	{
		client.process(ab2str(event.data));
	});
	socket.addEventListener('error', function(event)
	{
		rejectResult(event);
	});

	return resultPromise;
}
