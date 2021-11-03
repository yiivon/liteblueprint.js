function Concentrator() {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [80, 30];
    //this.addProperty("msg", "");
    this.addInput("in", LiteGraph.ACTION, {label: '输入'});
    this.addOutput("out", LiteGraph.EVENT, {label: '输出'});
}

Concentrator.title = "集线器";
Concentrator.desc = "将多个输入汇集为一束数据通过事件触发传递给下游接收者。";

Concentrator.prototype.onAction = function (action, param) {
    //console.log(arguments);
    if (action === 'in') {
        for (let i in this.inputs) {
            if (!this.inputs.hasOwnProperty(i)) continue;
            let s = this.inputs[i];

            if (s.type !== LiteGraph.ACTION && s.link !== null) {
                let v = this.getInputData(i);
                param = {...param, [s.name]: v};
            }
        }

        this.triggerSlot(0, param);
    }
};

Concentrator.prototype.onConfigure = function (cfg) {
};

Concentrator.prototype.onSerialize = function (cfg) {
};

Concentrator.prototype.onGetInputs = function () {
    return [];
};

Concentrator.prototype.onConnectionsChange = function (type,
                                                       slotIndex,
                                                       isConnected,
                                                       link,
                                                       ioSlot) {
    if (type === LiteGraph.OUTPUT) {
        if (ioSlot?.name === 'out' && link && !this.is_unserialize) {
            let linked_info = this.getOutputLinkedSlots(link.origin_slot) ?? [];
            let schema = linked_info.reduce((obj, info, i) => {
                let slot = info.slot;
                if (slot) {
                    Object.assign(obj, slot.schema ?? {});
                }
                return obj;
            }, {});

            this.removeInputBy((slot) => {
                return slot.type !== LiteGraph.EVENT;
            });

            if (!isConnected) {
                return;
            }

            for (let p in schema) {
                if (!schema.hasOwnProperty(p)) continue;

                let v = schema[p];
                v = (typeof v === 'string' ? {type: v} : v);
                this.addInput(p, v.type, v);
            }
        }
    }
};

LiteGraph.registerNodeType("连接件/集线器", Concentrator);


function Distributor() {
    this.mode = LiteGraph.ON_EVENT;
    this.size = [80, 30];
    //this.addProperty("msg", "");
    this.addInput("in", LiteGraph.ACTION, {label: '输入'});
    this.addOutput("out", LiteGraph.EVENT, {label: '输出'});
}

Distributor.title = "分线器";
Distributor.desc = "将触发事件附带的数据分解为多个输出。";


Distributor.prototype.onConnectionsChange = function (type,
                                                      slotIndex,
                                                      isConnected,
                                                      link,
                                                      ioSlot) {
    if (type === LiteGraph.INPUT) {
        if (ioSlot?.name === 'in' && link && !this.is_unserialize) {
            let linked_info = this.getInputLinkedSlot(link.target_slot);
            let schema = linked_info?.slot?.schema ?? {};

            this.removeOutputBy((slot) => {
                return slot.type !== LiteGraph.EVENT;
            });

            if (!isConnected) {
                return;
            }

            for (let p in schema) {
                if (!schema.hasOwnProperty(p))
                    continue;

                let v = schema[p];
                v = (typeof v === 'string' ? {type: v} : v);
                this.addOutput(p, v.type, v);
            }
        }
    }
};

Distributor.prototype.onAction = function (action, param) {
    if (action === 'in') {
        for (let i in this.outputs) {
            let s = this.outputs[i];
            if (s?.type !== LiteGraph.EVENT) {
                if (s.links && (s.links.length > 0) && s.name) {
                    this.setOutputData(i, param?.[s.name]);
                }
            }
        }

        this.triggerSlot(0, param);
    }
};

LiteGraph.registerNodeType("连接件/分线器", Distributor);

