

function SoyWebSocket($Name,$DefaultHostname,$ParentDiv,$OnConnected,$OnDisconnected)
{
	if ( !$DefaultHostname )
		$DefaultHostname = "localhost:8080";
	
	this.mName = $Name;
	this.mSocket = null;
	this.mIsConnected = false;
	this.mDiv = null;
	this.mConnectingUrl = false;
	
	//	default callback functions
	this.mOnTextMessage = function($SoyWebSocket,$Message)		{	console.log( $SoyWebSocket.mName + "::mOnMessage()");	}
	this.mOnBinaryMessage = function($SoyWebSocket,$Message)		{	console.log( $SoyWebSocket.mName + "::mOnMessage()");	}
	this.mOnConnected = function($SoyWebSocket)			{	console.log( $SoyWebSocket.mName + "::mOnConnected()");	$OnConnected($SoyWebSocket);		}
	this.mOnDisconnected = function($SoyWebSocket)		{	console.log( $SoyWebSocket.mName + "::mOnDisconnected()");	$OnDisconnected($SoyWebSocket);	}
	this.mOnConnecting = function($SoyWebSocket,$Url)		{	console.log( $SoyWebSocket.mName + "::Connecting to " + $Url + "...");	}

	this.CreateUI( $DefaultHostname, $ParentDiv );
	this.OnDisconnected(true);
}

SoyWebSocket.prototype.IsConnected = function()
{
	return this.mSocket && this.mIsConnected;
}


SoyWebSocket.prototype.Connect = function()
{
	var $Url = this.mUrlInput.value;
	if ( this.mConnectingUrl === $Url )
	{
		console.log("Already trying to connect to " + $Url );
		return;
	}
	
	this.Disconnect();
	if ( this.mOnConnecting )
		this.mOnConnecting( this, $Url );
	
	this.mSocket = new WebSocket( $Url );
	this.mConnectingUrl = $Url;
	this.mSocket.mSoyWebSocket = this;

	this.mSocket.onopen =		function($Event) {	$Event.srcElement.mSoyWebSocket.OnConnected($Event);	};
	this.mSocket.onclose =		function($Event) {	$Event.srcElement.mSoyWebSocket.OnClosed($Event);	};
	this.mSocket.onmessage =	function($Event) {	$Event.srcElement.mSoyWebSocket.OnMessage($Event);	};
	this.mSocket.onerror =		function($Event) {	$Event.srcElement.mSoyWebSocket.OnError($Event);	};

	//	todo: defer connect to here in case it connects before we've setup callbacks!
}

SoyWebSocket.prototype.OnConnected = function($Event)
{
//	console.log("on connected" + this.mConnectingUrl);
//	console.log($Event);
	this.mIsConnected = true;
	this.mConnectingUrl = false;
	this.mDisconnectButton.disabled = false;
	this.mConnectButton.disabled = true;
	
	if ( this.mOnConnected )
		this.mOnConnected( this );
}

SoyWebSocket.prototype.OnClosed = function($Event)
{
//	console.log("on closed");
//	console.log($Event);
	this.Disconnect();
}

SoyWebSocket.prototype.OnMessage = function($Event)
{
//	console.log("on message");
//	console.log($Event);
	
	if ( $Event.data instanceof Blob )
	{
		if ( this.mOnBinaryMessage )
		{
			this.mOnBinaryMessage( this, $Event.data );
		}
	}
	else if ( this.mOnTextMessage )
	{
		$Message = $Event.data;
		this.mOnTextMessage( this, $Message );
	}
}

SoyWebSocket.prototype.OnError = function($Event)
{
//	console.log("on error");
//	console.log($Event);
	this.Disconnect();
}

SoyWebSocket.prototype.Disconnect = function()
{
	if ( !this.mSocket )
	{
		this.OnDisconnected(true);
		return;
	}
	
//	console.log( this.mName + " disconnecting" );
	this.mSocket.close();
	this.OnDisconnected(false);
}

SoyWebSocket.prototype.OnDisconnected = function(Forced)
{
	//console.log("Ondisconnceted " + this.mConnectingUrl);
	this.mIsConnected = false;
	this.mSocket = null;
	this.mConnectingUrl = false;
	this.mDisconnectButton.disabled = true;
	this.mConnectButton.disabled = false;
	
	if ( !Forced )
		if ( this.mOnDisconnected )
			this.mOnDisconnected( this );
}

SoyWebSocket.prototype.CreateUI = function($DefaultHostname,$ParentDiv)
{
	this.mDiv = document.createElement("DIV");
	this.mDiv.className = "SoyWebSocket";
	
	if ( this.mName != null )
	{
		var Header = document.createTextNode("Websocket connection to: " + this.mName );
		this.mDiv.appendChild(Header);
		this.mDiv.appendChild( document.createElement("br") );
	}
	
	var UrlLabel = document.createElement("label");
	UrlLabel.innerText = "Host";
	this.mDiv.appendChild( UrlLabel );
	
	this.mUrlInput = document.createElement("input");
	this.mUrlInput.value = "ws://" + $DefaultHostname;
	this.mDiv.appendChild( this.mUrlInput );
	
	this.mConnectButton = document.createElement("button");
	this.mConnectButton.innerText = "Connect";
	this.mConnectButton.mSocket = this;
	this.mConnectButton.onclick = function(e) {	e.toElement.mSocket.Connect();	};
	this.mDiv.appendChild( this.mConnectButton );
	
	this.mDisconnectButton = document.createElement("button");
	this.mDisconnectButton.innerText = "Disconnect";
	this.mDisconnectButton.mSocket = this;
	this.mDisconnectButton.onclick = function(e) {	e.toElement.mSocket.Disconnect();	};
	this.mDiv.appendChild( this.mDisconnectButton );
	
	if ( $ParentDiv != null )
		$ParentDiv.appendChild( this.mDiv );
	else
		document.body.appendChild( this.mDiv );
}

SoyWebSocket.prototype.SendMessage = function($Message)
{
	if ( !this.mSocket )
	{
		console.log( this.mName + " not connected. SendMessage() aborted" );
		return false;
	}
	
	this.mSocket.send($Message);
	return true;
}

