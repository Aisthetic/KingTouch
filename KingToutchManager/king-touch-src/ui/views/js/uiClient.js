const UI_SERVER = "ws://localhost:5555/";
var wsClient; 

function connectUI()
{
	wsClient = new WebSocket(UI_SERVER,'echo-protocol');
	wsClient.onopen = function()
	{
		console.log("UI connection opened !");
		sendUI("globalUpdateRequest",{});
	};

	wsClient.onmessage = function (data) 
	{ 
		var m = JSON.parse(data.data);
		if(typeof m.call == "undefined"){
			console.log("Undefined ui message received !");
		}
		window.dispatchEvent(new CustomEvent(
			m.call,
			{
				detail: m.data,
				bubbles: true,
				cancelable: false
			}
		));
	};
	wsClient.onerror = reconnect;
	wsClient.onclose = function()
	{ 
		console.log("Connection is closed..."); 
		reconnect();
	};
}

function sendUI(callName,data){
	wsClient.send(JSON.stringify({call: callName,data:data}));

}
function emitUI(callName,data){
	window.dispatchEvent(new CustomEvent(
			callName,
			{
				detail: data,
				bubbles: true,
				cancelable: false
			}
		));
}

function reconnect(){
	
}