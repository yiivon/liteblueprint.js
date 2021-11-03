function MT4Client() {
    this.size = [60, 20];
    this.addInput("stop", LiteGraph.ACTION, {label: '停止'});
    this.addInput("trade", LiteGraph.ACTION, {
        label: '交易',
        schema: {
            type: {type: 'string', label: '类型'},
            symbol: {type: 'string', label: '商品'},
            volume: {type: 'number', label: '手数'},
            open_price: {type: 'float', label: '开仓价'},
            stop_loss: {type: 'float', label: '止损价'},
            take_profit: {type: 'float', label: '获利价'},
            expiration: {type: 'number', label: '超时'},
            magic: {type: 'number', label: 'Magic'},
            comment: {type: 'string', label: '备注'}
        }
    });
    this.addOutput("tick", LiteGraph.EVENT, {
        label: '报价',
        schema: {
            ts: {type: 'number', label: '时间戳'},
            symbol: {type: 'string', label: '商品'},
            ask: {type: 'float', label: '买价'},
            bid: {type: 'float', label: '卖价'}
        }
    });
    this.addOutput("trade", LiteGraph.EVENT, {
        label: '交易', schema: {
            id: {type: 'number', label: 'ID'},
            type: {type: 'string', label: '类型'},
            symbol: {type: 'string', label: '商品'},
            volume: {type: 'number', label: '手数'},
            open_time: {type: 'number', label: '开仓时间'},
            open_price: {type: 'float', label: '开仓价'},
            stop_loss: {type: 'float', label: '止损价'},
            take_profit: {type: 'float', label: '获利价'},
            close_time: {type: 'number', label: '平仓时间'},
            expiration: {type: 'number', label: '超时'},
            reason: {type: 'number', label: '原因'},
            close_price: {type: 'float', label: '平仓价'},
            profit: {type: 'float', label: '盈利'},
            magic: {type: 'number', label: 'Magic'},
            comment: {type: 'string', label: '备注'}
        }
    });

    let that = this;
    this.separator = this.addWidget("separator", "", "", null, {});
    this.cmb_account = this.addWidget("combo", "帐户选择", "", this.onAccountChange.bind(this), {values: []});
    this.button = this.addWidget("button", "开关", null, function (v) {
        if (that._io.connected) {
            that.stop();
        } else {
            that.start();
        }
    }, {});

    this.properties = {
        url: "",
    };

    this._account_list = null;
    this._account_default = '';
    this._send_data_cache = [];
    this._io = null;

    this.start();

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
    this.stop();
};

MT4Client.prototype.onConfigure = function (cfg) {
    this._account_default = cfg.widgets_values?.[1] ?? '';
};

MT4Client.prototype.onSerialize = function (cfg) {
    delete cfg.boxcolor;
};

MT4Client.prototype.onAccountChange = function (v) {
    if (v) {
        this.register(v);
    }
};

MT4Client.prototype.start = function () {
    if (this._io) {
        this._io.emit('subscribe-tick', !!this.getOutputNodes(0), function (msg) {
            console.log(msg);
        });
    }

    this._io = this.initSocket();
};

MT4Client.prototype.stop = function () {
    if (this._io) this._io.disconnect();
};

MT4Client.prototype.initSocket = function () {
    let socket = io('ws://127.0.0.1:8896');

    let that = this;

    let emit = socket.emit;
    socket.emit = function () {
        if (!this.connected) {
            that._send_data_cache.push(arguments);
        } else {
            emit.apply(this, arguments);
        }
    };

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
                that.onAccountChange(that._account_default);
            }
        });
    });

    socket.on('disconnect', function () {
        console.log('disconnect');
        that.boxcolor = LiteGraph.NODE_DEFAULT_BOXCOLOR;
    });

    const ontradingevent = function (type, trade) {
        that.triggerSlot(1, {...trade, action: type});
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
        //tick = [symbol_id, symbol_name, ts, bid, ask];
        that.triggerSlot(0, {id: tick[0], symbol: tick[1], ts: tick[2], bid: tick[3], ask: tick[4]});
    });

    return socket;
};

MT4Client.prototype.register = function (iid) {
    let that = this;
    if (this._io) {
        this._io.emit('register', {iid, type: 'c'}, function (msg) {
            console.log(msg);
            that._account_default = iid;
            that.boxcolor = "#6C6";
            do {
                let argvs = that._send_data_cache.shift();
                if (!argvs) break;
                that._io.emit(...argvs);
            } while (true);
        });
    }
};

MT4Client.prototype.onAction = function (action, param) {
    if (action === 'trade') {
        console.log(arguments)
    } else if (action === 'stop') {
        if (param) this.stop();
        else {
            // is tick event connected?
            this.start();
        }
    }
};

MT4Client.prototype.onGetInputs = function () {
    return [];
};

MT4Client.prototype.onGetOutputs = function () {
    return [];
};


LiteGraph.registerNodeType("实例/MT4", MT4Client);