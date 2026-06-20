/* MagicMirror2 Module Helper: MMM-HormuzBanner */
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
	socketNotificationReceived: function (notification) {
		if (notification !== "MMM_HORMUZBANNER_TEST") {
			return;
		}

		this.sendSocketNotification("MMM_HORMUZBANNER_TEST_RESULT", {
			status: "OPEN",
			passed24h: "123",
			waiting: "4"
		});
	}
});
