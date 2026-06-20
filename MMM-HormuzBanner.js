/* MagicMirror2 Module: MMM-HormuzBanner */
Module.register("MMM-HormuzBanner", {
	defaults: {
		sourceUrl: "https://hormuzstraitmonitor.com/",
		updateInterval: 60 * 60 * 1000,
		title: "HORMUZ",
		message: "Loading",
		labels: {
			passed24h: "24H PASSED",
			waiting: "WAITING",
			updated: "UPDATED"
		},
		show: {
			status: true,
			passed24h: true,
			waiting: true,
			updated: false
		}
	},

	start: function () {
		this.payload = null;
		this.updateTimer = null;
		this.fetchData();
	},

	getStyles: function () {
		return ["MMM-HormuzBanner.css"];
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = "mmm-hormuz-banner small bright";

		var title = document.createElement("span");
		title.className = "mmm-hormuz-banner-title";
		title.textContent = this.config.title + ": ";
		wrapper.appendChild(title);

		var value = document.createElement("span");
		value.className = "mmm-hormuz-banner-value " + this.getStatusClass();
		value.textContent = this.getMessage();
		wrapper.appendChild(value);

		return wrapper;
	},

	getStatusClass: function () {
		if (!this.payload || this.payload.error) {
			return "";
		}

		var status = String(this.payload.status || "").toLowerCase();
		if (status === "open" || status === "closed" || status === "restricted") {
			return "mmm-hormuz-banner-status-" + status;
		}

		return "";
	},

	getMessage: function () {
		if (!this.payload) {
			return this.config.message;
		}

		if (this.payload.error) {
			return "unavailable";
		}

		return this.buildRows().join(" \u00b7 ");
	},

	buildRows: function () {
		var rows = [];
		var labels = this.config.labels || {};
		var show = this.config.show || {};

		if (show.status) {
			rows.push(this.payload.status || "Unknown");
		}

		if (show.passed24h) {
			rows.push((labels.passed24h || "24H PASSED") + ": " + (this.payload.passed24h || "Unknown"));
		}

		if (show.waiting) {
			rows.push((labels.waiting || "WAITING") + ": " + (this.payload.waiting || "Unknown"));
		}

		if (show.updated) {
			rows.push((labels.updated || "UPDATED") + ": " + this.formatUpdated(this.payload.updated));
		}

		return rows.length ? rows : ["Unknown"];
	},

	formatUpdated: function (updated) {
		if (!updated) {
			return "Unknown";
		}

		return new Date(updated).toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit"
		});
	},

	fetchData: function () {
		this.sendSocketNotification("MMM_HORMUZBANNER_FETCH", {
			sourceUrl: this.config.sourceUrl
		});
	},

	scheduleNextFetch: function () {
		if (this.updateTimer) {
			clearTimeout(this.updateTimer);
		}

		var interval = Math.max(5 * 60 * 1000, Number(this.config.updateInterval) || 60 * 60 * 1000);
		this.updateTimer = setTimeout(this.fetchData.bind(this), interval);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_DATA") {
			return;
		}

		this.payload = payload;
		this.updateDom(0);
		this.scheduleNextFetch();
	}
});
