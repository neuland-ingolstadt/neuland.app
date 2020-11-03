function thiAppRequest(params)
{
	// T-TeleSec GlobalRoot Class 2
	// valid until 02.10.2033, 1:59:59 CEST 
	var thiCerts = [
		`-----BEGIN CERTIFICATE-----
		MIIDwzCCAqugAwIBAgIBATANBgkqhkiG9w0BAQsFADCBgjELMAkGA1UEBhMCREUx
		KzApBgNVBAoMIlQtU3lzdGVtcyBFbnRlcnByaXNlIFNlcnZpY2VzIEdtYkgxHzAd
		BgNVBAsMFlQtU3lzdGVtcyBUcnVzdCBDZW50ZXIxJTAjBgNVBAMMHFQtVGVsZVNl
		YyBHbG9iYWxSb290IENsYXNzIDIwHhcNMDgxMDAxMTA0MDE0WhcNMzMxMDAxMjM1
		OTU5WjCBgjELMAkGA1UEBhMCREUxKzApBgNVBAoMIlQtU3lzdGVtcyBFbnRlcnBy
		aXNlIFNlcnZpY2VzIEdtYkgxHzAdBgNVBAsMFlQtU3lzdGVtcyBUcnVzdCBDZW50
		ZXIxJTAjBgNVBAMMHFQtVGVsZVNlYyBHbG9iYWxSb290IENsYXNzIDIwggEiMA0G
		CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQCqX9obX+hzkeXaXPSi5kfl82hVYAUd
		AqSzm1nzHoqvNK38DcLZSBnuaY/JIPwhqgcZ7bBcrGXHX+0CfHt8LRvWurmAwhiC
		FoT6ZrAIxlQjgeTNuUk/9k9uN0goOA/FvudocP05l03Sx5iRUKrERLMjfTlH6VJi
		1hKTXrcxlkIF+3anHqP1wvzpesVsqXFP6st4vGCvx9702cu+fjOlbpSD8DT6Iavq
		jnKgP6TeMFvvhk1qlVtDRKgQFRzlAVfFmPHmBiiRqiDFt1MmUUOyCxGVWOHAD3bZ
		wI18gfNycJ5v/hqO2V81xrJvNHy+SE/iWjnX2J14np+GPgNeGYtEotXHAgMBAAGj
		QjBAMA8GA1UdEwEB/wQFMAMBAf8wDgYDVR0PAQH/BAQDAgEGMB0GA1UdDgQWBBS/
		WSA2AHmgoCJrjNXyYdK4LMuCSjANBgkqhkiG9w0BAQsFAAOCAQEAMQOiYQsfdOhy
		NsZt+U2e+iKo4YFWz827n+qrkRk4r6p8FU3ztqONpfSO9kSpp+ghla0+AGIWiPAC
		uvxhI+YzmzB6azZie60EI4RYZeLbK4rnJVM3YlNfvNoBYimipidx5joifsFvHZVw
		IEoHNN/q/xWA5brXethbdXwFeilHfkCoMRN3zUA7tFFHei4R40cR3p1m0IvVVGb6
		g1XqfMIpiRvpb7PO4gWEyS8+eIVibslfwXhjdFjASBgMmTnrpMwatXlajRWc2BQN
		9noHV8cigwUtPJslJj0Ys6lDfMjIq2SPDqO/nBudMNva0Bkuqjzx+zOAduTNrRlP
		BSeOE6Fuwg==
		-----END CERTIFICATE-----`,
	];

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
		caStore: thiCerts,
		virtualHost: "hiplan.thi.de",
		verify: function(connection, verified, depth, certs)
		{
			if(certs[0].subject.getField('CN').value != "hiplan.thi.de")
				return false;
			return verified;
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
