
function Concentrator() {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [80, 30];
    this.addProperty("msg", "");
    this.addInput("in", LiteGraph.EVENT);
    this.addOutput("out", LiteGraph.EVENT);
}

Concentrator.title = "集线器";
Concentrator.desc = "将多个输入汇集为一束数据通过事件触发传递给下游接收者。";

Concentrator.prototype.onAction = function (action, param) {
    console.log(arguments);
};

Concentrator.prototype.onExecute = function () {

};

Concentrator.prototype.onGetInputs = function () {
    return [
    ];
};

Concentrator.prototype.onConnectionsChange = function (type,
                                                       slotIndex,
                                                       isConnected,
                                                       link,
                                                       ioSlot) {
    if(type === LiteGraph.OUTPUT) {
        // TODO: should be merging all nodes' scheme relate to
        debugger
        let output_nodes = this.getOutputNodes(link.origin_slot) ?? [];
        let scheme = output_nodes.reduce((obj, node, i) => {
            let slot = node.getInputInfo(link.target_slot);
            if(slot) {
                Object.assign(obj, slot.scheme ?? {});
            }
            return obj;
        }, {});

        this.removeInputBy((slot) => {
            return slot.type !== LiteGraph.EVENT;
        });

        if(!isConnected) {
            return;
        }

        for(let p in scheme) {
            if(!scheme.hasOwnProperty(p)) continue;

            let v = scheme[p];
            v = (typeof v === 'string' ? {type: v} : v);
            this.addInput(p, v.type);
        }
    }
};

LiteGraph.registerNodeType("连接件/集线器", Concentrator);


function Distributor() {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [80, 30];
    this.addProperty("msg", "");
    this.addInput("in", LiteGraph.EVENT);
    this.addOutput("out", LiteGraph.EVENT);
}

Distributor.title = "分线器";
Distributor.desc = "将触发事件附带的数据分解为多个输出。";

LiteGraph.registerNodeType("连接件/分线器", Distributor);

