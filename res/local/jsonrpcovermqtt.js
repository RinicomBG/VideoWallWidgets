class JsonRpcService {
	constructor(uri, topic) {
		/*
		const uri_decoder = /^([a-z]+):\/\/(([A-Za-z0-9]+):([A-Za-z0-9]+)@)?([A-Za-z0-9\._-]+)(:([0-9]+))?\/?/;
		const uri_parts = uri.match(uri_decoder);
		var hostname = uri_parts[5];
		var portnumber = uri_parts[7] === undefined ? 9000 : Number(uri_parts[7]);
		*/
		var self = this;
		var dataConnection = mqtt.connect(uri, topic);
		dataConnection.on('connect', function (event) {
			console.log("Connected " + uri + ", subscribing to " + topic + " topic");
			self.clientId = dataConnection.options.clientId;
			dataConnection.subscribe(topic);
		}.bind(dataConnection));
		dataConnection.on('message', this.receiveMessage.bind(this));
		dataConnection.on('close', this.errorHandler.bind(this));
		dataConnection.on('offline', this.errorHandler.bind(this));
		dataConnection.on('disconnect', this.errorHandler.bind(this));
		dataConnection.on('error', this.errorHandler.bind(this));
		this.mqtt_conn = dataConnection;
		this.connected_uri = uri;
		this.defaultTopic = undefined;
		this.activeMessages = {};
		this.baseId = "JSJSONRPC-" + Date.now() + "-" + Math.floor(Math.random()* 1000) + "/";
		this.currentId = 0;
		this.onMethodCalled = function(topic, message) { console.log("method call received on topic " + topic, message); }
	}

	_sendMessage(topic, message, handler) {
		if (typeof message !== 'object') {
			console.error("All messages must be objects!", message);
			return;
		}
		// all messages must have an id, even if the message is a request (this
		// server does not cuurently support notifications
		if (message["id"] === undefined) {
			return;
		}
		if (message["method"] === undefined) {
			// this message is a response, not a method call and so does not expect a
			// response
			this.mqtt_conn.publish(topic, JSON.stringify(message));
			return;
		}
		if (message["id"] === null) {
			message["id"] = this.baseId + this.currentId;
			this.currentId = this.currentId + 1;
		} else {
			console.warn("Message already has an id", message["id"]);
			if (this.activeMessages[message["id"]] !== undefined) {
				console.warn("Message clashes with existing message", message["id"]);
			}
		}
		this.activeMessages[message["id"]] = {sentMessage:message,handler:handler,timeoutTime:(Date.now()+5000)};
		this.mqtt_conn.publish(topic, JSON.stringify(message));
	}

	sendMessage(topic, message, handler) {
		if (message.length !== undefined) {
			for (var key in message) {
				this._sendMessage(topic, message[key], handler);
			}
		} else {
			this._sendMessage(topic, message, handler);
		}
	}

	_receiveMessage(topic, message) {
		var skipIt = false;
		if (message["method"] && typeof message["method"] === "string") {
			if (message["id"] !== undefined) {
				if (this.activeMessages[message["id"]] !== undefined) {
					console.log("got message sent by us");
					skipIt = true;
				}
			}
			if (!skipIt) {
				this.onMethodCalled(topic, message);
			}
			return;
		}
		if (message["id"] === undefined) {
			console.warn("Message received without id or method (ignoring)");
			return;
		}
		var activeElement = this.activeMessages[message["id"]];
		if (activeElement === undefined) {
			console.log("Message " + message["id"] + " not found in active messages");
			return;
		}
		this.activeMessages[message["id"]] = undefined;
		delete this.activeMessages[message["id"]];
		if (activeElement.handler === undefined) {
			console.warn("No handler defined for " + message["id"]);
			return;
		}
		activeElement.handler.response(activeElement.sentMessage, message);
	}

	receiveMessage(topic, message) {
		//console.log("Got Message", topic, this.connected_uri);
		message = JSON.parse(message.toString());

		if (message.length !== undefined) {
			for (var i = 0; i < message.length; ++i) {
				this._receiveMessage(topic, message[i]);
			}
		} else {
			this._receiveMessage(topic, message);
		}

		for (var key in this.activeMessageQueue) {
			numberOfKeys = numberOfKeys + 1;
			var activeMessage = this.activeMessageQueue[key];
			if (activeMessage.timeoutTime < Date.now()) {
				console.log("Timeout for " + key);
				if (activeMessage.handler === undefined) {
					console.warn("No handler defined for " + activeMessage["id"]);
				} else {
					activeMessage.handler.timeout(activeMessage);
				}
				delete this.activeMessages[key];
			}
		}
	}

	disconnect() {
		this.mqtt_conn.end();
	}

	errorHandler(message) {
		console.error("Error from " + this.connected_uri, message);
	}
}
