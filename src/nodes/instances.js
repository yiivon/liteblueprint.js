function MT4Client() {
    this.size = [60, 20];
    this.addInput("stop", LiteGraph.ACTION, {label: '停止'});
    this.addInput("trade", LiteGraph.ACTION, {label: '交易'});
    this.addOutput("tick", LiteGraph.EVENT, {label: '报价'});
    this.addOutput("trade", LiteGraph.EVENT, {label: '交易'});

    this.separator = this.addWidget("separator", "", "", null, {});
    this.cmb_account = this.addWidget("combo", "帐户选择", "", this.onAccountChange.bind(this), {values: []});

    this.properties = {
        url: "",
    };

    this._account_list = null;
    this._account_default = '';

    this._io = this.initSocket();
    this.size = this.computeSize();
    this.serialize_widgets = true;
}

MT4Client.title = "MT4实例";
MT4Client.desc = "MT4终端实例，可接收报价交易事件并能进行实时下单交易。";

MT4Client.prototype.onPropertyChanged = function (name, value) {
    if (name === "url") {
        //this.connectSocket();
    }
};

MT4Client.prototype.onExecute = function () {

};

MT4Client.prototype.onConnectionsChange = function (type,
                                                    slotIndex,
                                                    isConnected,
                                                    link,
                                                    ioSlot) {
    if (type === LiteGraph.OUTPUT) {
        if (ioSlot?.name === 'tick') {
            if (isConnected) {
                this._io.emit('subscribe-tick', true, function (msg) {
                    console.log(msg);
                });
            } else {
                this._io.emit('subscribe-tick', false, function (msg) {
                    console.log(msg);
                });
            }
        }
    }
};

MT4Client.prototype.onRemoved = function () {
    console.log('onRemoved')
    if (this._io) this._io.disconnect();
};

MT4Client.prototype.onConfigure = function (cfg) {
    this._account_default = cfg.widgets_values?.[1] ?? '';
};

MT4Client.prototype.onSerialize = function (cfg) {
    delete cfg.boxcolor;
};

MT4Client.prototype.onAccountChange = function (v) {
    if(v) {
        this.register(v);
    }
};

MT4Client.prototype.initSocket = function () {
    let socket = io('ws://127.0.0.1:8896');

    let that = this;
    socket.on('connect', function () {
        console.log('connect');
        // retrieve mt4 srv instances from server
        socket.emit('get-instances', {type: 'b'}, function (dat) {
            console.log(dat);
            if (dat?.status === 'success') {
                that.cmb_account.options.values = dat.instances.map((v) => {
                    if (typeof v === 'string') {
                        return {id: v, title: v};
                    }
                    return v;
                });
                that.cmb_account.value = that._account_default;
            }
        });
    });

    socket.on('disconnect', function () {
        console.log('disconnect');
    });

    const ontradingevent = function (type, trade) {
        that.triggerSlot(1, {type, trade});
    };

    socket.on('ontradeclose', function (trade) {
        ontradingevent('close', trade);
    });

    socket.on('ontradeopen', function (trade) {
        ontradingevent('open', trade);
    });

    socket.on('ontrademodify', function (trade) {
        ontradingevent('modify', trade);
    });

    socket.on('ontick', function (tick) {
        that.triggerSlot(0, tick);
    });

    return socket;
};

MT4Client.prototype.register = function (iid) {
    let that = this;
    if (this._io) {
        this._io.emit('register', {iid, type: 'c'}, function (msg) {
            console.log(msg);
            that.boxcolor = "#6C6";
        });
    }
};

MT4Client.prototype.send = function (data) {

};

MT4Client.prototype.onAction = function (action, param) {
    if(action === 'trade') {

    } else if(action === 'stop') {

    }
};

MT4Client.prototype.onGetInputs = function () {
    return [];
};

MT4Client.prototype.onGetOutputs = function () {
    return [];
};


LiteGraph.registerNodeType("实例/MT4", MT4Client);