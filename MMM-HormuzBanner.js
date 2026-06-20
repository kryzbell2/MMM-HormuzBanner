/* MagicMirror2 Module: MMM-HormuzBanner */
Module.register("MMM-HormuzBanner", {
	defaults: {
		sourceUrl: "https://hormuzstraitmonitor.com/",
		title: "HORMUZ",
		message: "TEST"
	},

	start: function () {
		this.payload = null;
		this.sendSocketNotification("MMM_HORMUZBANNER_FETCH_TEST", {
			sourceUrl: this.config.sourceUrl
		});
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

		return this.payload.message || "fetch failed";
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_FETCH_TEST_RESULT") {
			return;
		}

		this.payload = payload;
		this.updateDom(0);
	}
});
