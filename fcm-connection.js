const { register, listen } = require('push-receiver');
const fs = require('fs');
const path = require('path');

module.exports = function(RED) {
    function FcmConnection(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        node.name = n.name;
        node.serverkey = n.serverkey;
        node.callbacks = [];

		(async () => {
            var dir = path.join(RED.settings.userDir, 'fcm-receive/' + node.id);
            var credFile = path.join(dir, 'fcm.cred');
            var persistentIdsFile = path.join(dir, 'persistent.ids');

            try {
                fs.mkdirSync(dir, { recursive: true });
            } catch (e) {}

            var credentials;
            try {
                credentials = JSON.parse(fs.readFileSync(credFile));
            } catch(e) {
                credentials = await register(node.serverkey);
                fs.writeFileSync(credFile, JSON.stringify(credentials));
            }

            node.token = credentials.fcm.token;
            node.log('token: ' + credentials.fcm.token);

            credentials.persistentIds = [];
            try {
                credentials.persistentIds = fs.readFileSync(persistentIdsFile).toString().split("\n");
                fs.unlinkSync(persistentIdsFile);
            } catch(e) {}

            listen(credentials, onNotification);

            // Called on new notification
            function onNotification({ notification, persistentId }) {
              fs.appendFileSync(persistentIdsFile, persistentId + "\n");

              var msg = {payload: notification, messageId: persistentId};
              node.callbacks.forEach(function (callback){
                   callback(msg);
              });
            }
		})();
    }
    RED.nodes.registerType("fcm-connection", FcmConnection);

    RED.httpAdmin.get("/fcm_token/:id", RED.auth.needsPermission('fcm_token.read'), function(req, res) {
        var connectionNode = RED.nodes.getNode(req.params.id);
        if (connectionNode != null)
            res.end(connectionNode.token);
        else
            res.end("Connection is not registered");
    });
}