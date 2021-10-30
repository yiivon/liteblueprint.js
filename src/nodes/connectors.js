
function Concentrator() {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [80, 30];
    this.addProperty("msg", "");
    this.addInput("log", LiteGraph.EVENT);
    this.addInput("msg", 0);
    this.addOutput("out", LiteGraph.EVENT);
}

Concentrator.title = "集线器";
Concentrator.desc = "将多个输入汇集为一束数据通过事件触发传递给下游接收者。";

Concentrator.prototype.onAction = function (action, param) {
    if (action == "log") {
        console.log(param);
    } else if (action == "warn") {
        console.warn(param);
    } else if (action == "error") {
        console.error(param);
    }
};

Concentrator.prototype.onExecute = function () {
    var msg = this.getInputData(1);
    if (msg !== null) {
        this.properties.msg = msg;
    }
    console.log(msg);
};

Concentrator.prototype.onGetInputs = function () {
    return [
        ["log", LiteGraph.ACTION],
        ["warn", LiteGraph.ACTION],
        ["error", LiteGraph.ACTION]
    ];
};

Concentrator.prototype.onConnectionsChange = function (type,
                                                       slotIndex,
                                                       isConnected,
                                                       link,
                                                       ioSlot) {
    if(type === LiteGraph.OUTPUT) {
        let target_node = link ? this.graph.getNodeById(link.target_id) : null;

        if (!target_node) {
            return;
        }

        let slot = target_node.inputs?.[link.target_slot];
        if(!slot) return;

        let scheme = slot.scheme ?? {};
        if(!scheme) return;

        let ii = this.inputs?.length;
        for(let i=0; i<ii; i++) {
            this.removeInput(i);
        }

    }
};

LiteGraph.registerNodeType("连接件/集线器", Concentrator);


function Distributor() {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [80, 30];
    this.addProperty("msg", "");
    this.addInput("log", LiteGraph.EVENT);
    this.addInput("msg", 0);
}

Distributor.title = "分线器";
Distributor.desc = "Show value inside the console";

LiteGraph.registerNodeType("连接件/分线器", Distributor);

