const { register, listen } = require('push-receiver');
const fs = require('fs');

module.exports = function(RED) {
    function FcmReceiveNode(config) {
        RED.nodes.createNode(this, config);
        const serverKey = process.env.FCM_SERVER_KEY;
        var node = this;

		(async () => {
			try {
				fs.mkdirSync('fcm-receive');
			} catch (e) {}
			
			var credentials;
			try {
				credentials = JSON.parse(fs.readFileSync('fcm-receive/fcm.cred'));
			} catch(e) {
				credentials = await register(serverKey);
				fs.writeFileSync('fcm-receive/fcm.cred', JSON.stringify(credentials));
			}
			
			node.log('fcm-receive token: ' + credentials.fcm.token);
			
			var persistentIds = [];
			try {
				persistentIds = fs.readFileSync('fcm-receive/persistent.ids').toString().split("\n");
				fs.unlinkSync('fcm-receive/persistent.ids');
			} catch(e) {}
			credentials.persistentIds = persistentIds;
			listen(credentials, onNotification);

			// Called on new notification
			function onNotification({ notification, persistentId }) {
			  var msg = {payload: notification, messageId: persistentId};
			  node.send(msg);
			  fs.appendFileSync('fcm-receive/persistent.ids', persistentId + "\n");
			}
		})();
    }
    RED.nodes.registerType("fcm-receive", FcmReceiveNode);
}