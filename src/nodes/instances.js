
function MT4Client() {
    this.size = [60, 20];
    this.addInput("send", LiteGraph.ACTION);
    this.addOutput("received", LiteGraph.EVENT);
    this.addInput("in", 0);
    this.addOutput("out", 0);
    this.properties = {
        url: "",
        room: "lgraph", //allows to filter messages,
        only_send_changes: true
    };
    this._ws = null;
    this._last_sent_data = [];
    this._last_received_data = [];
}

MT4Client.title = "MT4实例";
MT4Client.desc = "Send data through a websocket";

MT4Client.prototype.onPropertyChanged = function(name, value) {
    if (name === "url") {
        this.connectSocket();
    }
};

MT4Client.prototype.onExecute = function() {
    if (!this._ws && this.properties.url) {
        this.connectSocket();
    }

    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        return;
    }

    let room = this.properties.room;
    let only_changes = this.properties.only_send_changes;

    for (let i = 1; i < this.inputs.length; ++i) {
        let data = this.getInputData(i);
        if (data == null) {
            continue;
        }
        let json;
        try {
            json = JSON.stringify({
                type: 0,
                room: room,
                channel: i,
                data: data
            });
        } catch (err) {
            continue;
        }
        if (only_changes && this._last_sent_data[i] == json) {
            continue;
        }

        this._last_sent_data[i] = json;
        this._ws.send(json);
    }

    for (let i = 1; i < this.outputs.length; ++i) {
        this.setOutputData(i, this._last_received_data[i]);
    }

    if (this.boxcolor === "#AFA") {
        this.boxcolor = "#6C6";
    }
};

MT4Client.prototype.connectSocket = function() {
    let that = this;
    let url = this.properties.url;
    if (url.substr(0, 2) !== "ws") {
        url = "ws://" + url;
    }
    this._ws = new WebSocket(url);
    this._ws.onopen = function() {
        console.log("ready");
        that.boxcolor = "#6C6";
    };
    this._ws.onmessage = function(e) {
        that.boxcolor = "#AFA";
        let data = JSON.parse(e.data);
        if (data.room && data.room !== that.properties.room) {
            return;
        }
        if (data.type === 1) {
            if (
                data.data.object_class &&
                LiteGraph[data.data.object_class]
            ) {
                let obj = null;
                try {
                    obj = new LiteGraph[data.data.object_class](data.data);
                    that.triggerSlot(0, obj);
                } catch (err) {
                    return;
                }
            } else {
                that.triggerSlot(0, data.data);
            }
        } else {
            that._last_received_data[data.channel || 0] = data.data;
        }
    };
    this._ws.onerror = function(e) {
        console.log("couldnt connect to websocket");
        that.boxcolor = "#E88";
    };
    this._ws.onclose = function(e) {
        console.log("connection closed");
        that.boxcolor = "#000";
    };
};

MT4Client.prototype.send = function(data) {
    if (!this._ws || this._ws.readyState != WebSocket.OPEN) {
        return;
    }
    this._ws.send(JSON.stringify({ type: 1, msg: data }));
};

MT4Client.prototype.onAction = function(action, param) {
    if (!this._ws || this._ws.readyState != WebSocket.OPEN) {
        return;
    }
    this._ws.send({
        type: 1,
        room: this.properties.room,
        action: action,
        data: param
    });
};

MT4Client.prototype.onGetInputs = function() {
    return [["in", 0]];
};

MT4Client.prototype.onGetOutputs = function() {
    return [["out", 0]];
};

LiteGraph.registerNodeType("实例/MT4", MT4Client);