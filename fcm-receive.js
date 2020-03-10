const { register, listen } = require('push-receiver');
const fs = require('fs');
const path = require('path');

module.exports = function(RED) {
    function FcmReceiveNode(config) {
        RED.nodes.createNode(this, config);
        const serverKey = process.env.FCM_SERVER_KEY;
        var node = this;

		(async () => {
		    var dir = path.join(RED.settings.userDir, 'fcm-receive');
		    var credFile = path.join(dir, 'fcm.cred');
		    var persistentIdsFile = path.join(dir, 'persistent.ids');

			try {
				fs.mkdirSync(dir);
			} catch (e) {}

			var credentials;
			try {
				credentials = JSON.parse(fs.readFileSync(credFile));
			} catch(e) {
				credentials = await register(serverKey);
				fs.writeFileSync(credFile, JSON.stringify(credentials));
			}
			
			node.log('fcm-receive token: ' + credentials.fcm.token);
			
			var persistentIds = [];
			try {
				persistentIds = fs.readFileSync(persistentIdsFile).toString().split("\n");
				fs.unlinkSync(persistentIdsFile);
			} catch(e) {}
			credentials.persistentIds = persistentIds;
			listen(credentials, onNotification);

			// Called on new notification
			function onNotification({ notification, persistentId }) {
			  var msg = {payload: notification, messageId: persistentId};
			  node.send(msg);
			  fs.appendFileSync(persistentIdsFile, persistentId + "\n");
			}
		})();
    }
    RED.nodes.registerType("fcm-receive", FcmReceiveNode);
}