/* MagicMirror2 Module: MMM-HormuzBanner */
Module.register("MMM-HormuzBanner", {
	defaults: {
		title: "HORMUZ",
		message: "TEST"
	},

	start: function () {
		this.payload = null;
		this.sendSocketNotification("MMM_HORMUZBANNER_TEST");
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = "small bright";
		wrapper.textContent = this.config.title + ": " + this.getMessage();
		return wrapper;
	},

	getMessage: function () {
		if (!this.payload) {
			return this.config.message;
		}

		return this.payload.status +
			" \u00b7 24H PASSED: " + this.payload.passed24h +
			" \u00b7 WAITING: " + this.payload.waiting;
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_TEST_RESULT") {
			return;
		}

		this.payload = payload;
		this.updateDom(0);
	}
});
