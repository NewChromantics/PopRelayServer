// require('nw.gui').Window.get().showDevTools();

var WebSocketServer = require('websocket').server;
var http = require('http');
var dgram = require('dgram');
var fs = require('fs');
var ip = require('ip');


//	gr: make these env vars from docker host
var ClientPort = 8080;
var ServerPort = 8081;
var DiscoverPort = 8082;

var LocalIP = ip.address();
var PathPrefix = './';
var RootUrlFile = 'Server.html';

// console.log(LocalIP);


//	cache buffer of last X packets here
var LastPacket = null;




function GetFilename(Url)
{
	//	for safety
	var Filename = Url.replace('/','');
	
	if ( Filename.length == 0 )
		Filename = RootUrlFile;

	Filename = PathPrefix + Filename;

	//	return null if it doesn't exist
	try
	{
		fs.accessSync( Filename, fs.R_OK );
		return Filename;
	}
	catch(exception)
	{
		console.log("File access denied: " + Filename + ": " + exception );
		return null;
	}
}

function GetFileContentsString(Filename)
{
	try
	{
		return fs.readFileSync( Filename ).toString();
	}
	catch(Exception)
	{
		return "404 " + Filename + ": " + Exception;
	}
};


function GetMime(Filename)
{
	var Extension = Filename.substring( Filename.lastIndexOf(".")+1 ).toLowerCase();

	switch(Extension){
		case 'mp4':
			return "video/mp4";
			break;
		case 'css':
			return "text/css";
			break;
		case 'css':
			return "application/javascript";
			break;
	}
	
	return "text/html";
}


function HandleClientWebpageRequest(request, response) 
{
	console.log((new Date()) + ' Received request for ' + request.url);

	var Filename = GetFilename( request.url );
	if ( Filename == null )
	{
		console.log("404 " + request.url );
		response.writeHead(404);
		response.end();
		return;
	}

	var Mime = GetMime( request.url );
	
	response.writeHead(200, {"Content-Type": Mime});

	console.log("Piping (" + Mime + ") " + Filename );

	//	stream contents
	//	http://stackoverflow.com/questions/7268033/basic-static-file-server-in-nodejs
	var fileStream = fs.createReadStream( Filename );
	fileStream.pipe( response );	
	//response.end( GetFileContentsString( Filename ) );
}


function HandleServerWebpageRequest(request, response) 
{
	if ( request.url == '/' )
	{
		response.writeHead(200);
		response.write("Server.");
		response.end();
		return;
	}
	response.writeHead(404);
	response.write(request.url);
	response.end();
	response.end();
}

var ServerHttp = http.createServer( HandleServerWebpageRequest );
var ClientHttp = http.createServer( HandleClientWebpageRequest );


ClientHttp.listen(ClientPort, function() {
    console.log((new Date()) + ' Websocket ClientHttp is listening on port ' + ClientPort );
});

ServerHttp.listen(ServerPort, function() {
    console.log((new Date()) + ' Websocket ServerHttp is listening on port ' + ServerPort );
});

var ServerWebsocket = new WebSocketServer({
    httpServer: ServerHttp,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

var ClientWebsocket = new WebSocketServer({
    httpServer: ClientHttp,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

var ServerConnections = [];
var ClientConnections = [];

function RegisterServer(Connection){
	ServerConnections.push( Connection );
	console.log((new Date()) + ' Server ' + Connection.remoteAddress + ' registered.');
}

function RegisterClient(Connection)
{
	ClientConnections.push( Connection );
	console.log((new Date()) + ' Client ' + Connection.remoteAddress + ' registered.');

	//	send first packet
	if ( LastPacket != null )
	{
		Connection.sendBytes(LastPacket); 
	}
}

function Unregister(Connection){
	console.log((new Date()) + ' Peer ' + Connection.remoteAddress + ' disconnected.');
}

function IsServer($Connection){
	return ( ServerConnections.indexOf($Connection) != -1 );
}

function IsClient($Connection){
	return ( ClientConnections.indexOf($Connection) != -1 );
}

function GetRelayTargetConnections(Connection){
	if ( IsServer(Connection) ){
		return ClientConnections;
	}else if ( IsClient(Connection) ){
		return ServerConnections;
	}else{
		return null;
	}
}

function RelayTo(Connections,Lambda){
	Connections.forEach( Lambda );
}
		
function Relay(Connection,Lambda){
	var Connections = GetRelayTargetConnections( Connection );
	if ( Connections == null ){
		console.log("Nowhere to relay lambda to");
		return;
	}
	RelayTo( Connections, Lambda );
}

function SetClientStatus(Connection,Message){
	var Command = {};
	Command.Command = 'SetStatus';
	Command.Status = Message;

	Connection.sendUTF( JSON.stringify(Command) );
}

function WrapClientMessage($Connection,$Message){
	//	to stop json/javascript escaping message, try and make it some json
	try{
		$Message = JSON.parse( $Message );
	}catch($e){
		//	message left as a string
		console.log("Couldn't json parse(" + $Message + ")");
	}


	var $ClientId = ClientConnections.indexOf($Connection);

	var $WrappedCommand = {};
	$WrappedCommand.Client = $ClientId;
	$WrappedCommand.Message = $Message;

	return JSON.stringify($WrappedCommand);
}

function OnServerPacket($Connection,$MessageBytes)
{
	LastPacket = $MessageBytes;
	Relay( $Connection, function(target) { target.sendBytes(LastPacket); } );
}

var OnServerWebsocketConnection = function(request)
{
	if (!originIsAllowed(request.origin)) 
	{
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}


	//var connection = request.accept('echo-protocol', request.origin);
	var connection = request.accept(null, request.origin);
	console.log((new Date()) + ' websocket server connection accepted.');
	RegisterServer( connection );

	connection.on('message', function(message) 
	{
		if (message.type === 'utf8') 
		{
			var $Message = message.utf8Data;
			//console.log('Received Message: ' + $Message);
			Relay( connection, function(target) { target.sendUTF($Message); } );
		}
		else if (message.type === 'binary') 
		{
			console.log('Received Binary Message of ' + message.binaryData.length + ' bytes from server');
			OnServerPacket( connection, message.binaryData );
		}
	});

	connection.on('close', function(reasonCode, description)
	{
		Unregister( connection );
	});
};


var OnClientWebsocketConnection = function(request)
{
	if (!originIsAllowed(request.origin)) 
	{
		// Make sure we only accept requests from an allowed origin
		request.reject();
		console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
		return;
	}

	//var connection = request.accept('echo-protocol', request.origin);
	var connection = request.accept(null, request.origin);
	console.log((new Date()) + ' websocket client connection accepted.');
	RegisterClient( connection );

	connection.on('message', function(message) 
	{
		if (message.type === 'utf8') 
		{
			var $Message = message.utf8Data;
			console.log('Received Client Message: ' + $Message);
		}
		else if (message.type === 'binary') 
		{
			console.log('Received Client Binary Message of ' + message.binaryData.length + ' bytes');
		}
	});

	connection.on('close', function(reasonCode, description)
	{
		Unregister( connection );
	});
};


ServerWebsocket.on('request', OnServerWebsocketConnection );
ClientWebsocket.on('request', OnClientWebsocketConnection );





var BroadcastSocket = dgram.createSocket('udp4');

BroadcastSocket.on('message', function (msg, info)
{
	console.log(info);
	console.log(msg.toString());
	if(msg.toString() == 'whoisserver')
	{
		var udpResponse = LocalIP+':'+ServerPort;
		BroadcastSocket.send(udpResponse, 0, udpResponse.length, info.port, info.address );
	}
	
	if(msg.toString() == 'whereisobserverserver')
	{
		var udpResponse = LocalIP+':'+ClientPort;
		BroadcastSocket.send(udpResponse, 0, udpResponse.length, info.port, info.address );
	}
});

BroadcastSocket.on('listening', function(){
    console.log((new Date()) + ' UDP Server is listening on port ' + DiscoverPort );
});

BroadcastSocket.bind( DiscoverPort );



fs.appendFile( PathPrefix + 'bootup.txt', 'Booted.\n', function (err) {
  if (err) {
   	console.log("Error writing to bootup.txt; " + err);
  }
});




