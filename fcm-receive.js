const { listen } = require('push-receiver');

module.exports = function(RED) {
    function FcmReceiveNode(config) {
        RED.nodes.createNode(this, config);
        var node = this;

        // Retrieve the config node
        node.connection = RED.nodes.getNode(config.connection);
        if (node.connection) {
            node.connection.callbacks.push(
                function(msg) {
                    node.send(msg);
                }
            );
        }
    }
    RED.nodes.registerType("fcm-receive", FcmReceiveNode);
}