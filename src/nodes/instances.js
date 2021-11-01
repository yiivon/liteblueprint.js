function MT4Client() {
    this.size = [60, 20];
    this.addInput("stop", LiteGraph.ACTION, {label: '停止'});
    this.addInput("trade", LiteGraph.ACTION, {label: '交易'});
    this.addOutput("tick", LiteGraph.EVENT, {label: '报价'});
    this.addOutput("trade", LiteGraph.EVENT, {label: '交易'});

    this.separator = this.addWidget("separator","", "", function(v){
    }, {} );

    this.combo = this.addWidget("combo","帐户选择", "red", function(v){
        console.log(v)
    }, { values:["red","green","blue", {title: 'ttttt'}]} );

    this.properties = {
        url: "",
    };

    this._ws = null;
    this._last_sent_data = [];
    this._last_received_data = [];

    this.size = this.computeSize();
    this.serialize_widgets = true;
}

MT4Client.title = "MT4实例";
MT4Client.desc = "MT4终端实例，可接收报价交易事件并能进行实时下单交易。";

MT4Client.prototype.onPropertyChanged = function (name, value) {
    if (name === "url") {
        this.connectSocket();
    }
};

MT4Client.prototype.onExecute = function () {

};

MT4Client.prototype.connectSocket = function () {
    let that = this;
    let url = this.properties.url;
    if (url.substr(0, 2) !== "ws") {
        url = "ws://" + url;
    }
    this._ws = new WebSocket(url);
    this._ws.onopen = function () {
        console.log("ready");
        that.boxcolor = "#6C6";
    };
    this._ws.onmessage = function (e) {
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
    this._ws.onerror = function (e) {
        console.log("couldnt connect to websocket");
        that.boxcolor = "#E88";
    };
    this._ws.onclose = function (e) {
        console.log("connection closed");
        that.boxcolor = "#000";
    };
};

MT4Client.prototype.send = function (data) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        return;
    }
    this._ws.send(JSON.stringify({type: 1, msg: data}));
};

MT4Client.prototype.onAction = function (action, param) {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
        return;
    }
    this._ws.send({
        type: 1,
        room: this.properties.room,
        action: action,
        data: param
    });
};

MT4Client.prototype.onGetInputs = function () {
    return [];
};

MT4Client.prototype.onGetOutputs = function () {
    return [];
};


LiteGraph.registerNodeType("实例/MT4", MT4Client);