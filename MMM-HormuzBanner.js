/* MagicMirror2 Module: MMM-HormuzBanner */
Module.register("MMM-HormuzBanner", {
	defaults: {
		sourceUrl: "https://hormuzstraitmonitor.com/",
		updateInterval: 60 * 60 * 1000,
		title: "HORMUZ",
		labels: {
			status: "Status",
			passed24h: "24H Passed",
			waiting: "Waiting",
			updated: "Updated"
		},
		show: {
			status: true,
			passed24h: true,
			waiting: true,
			updated: false
		},
		showLabels: {
			status: false,
			passed24h: true,
			waiting: true,
			updated: true
		},
		fullWidth: false,
		separator: " \u00b7 "
	},

	start: function () {
		this.payload = {
			status: "Unknown",
			passed24h: "Unknown",
			waiting: "Unknown",
			updated: null,
			error: null
		};
		this.loaded = false;
		this.scheduleUpdate();
	},

	getStyles: function () {
		return ["MMM-HormuzBanner.css"];
	},

	getDom: function () {
		var wrapper = document.createElement("div");
		wrapper.className = "mmm-hormuz-banner";
		if (this.config.fullWidth) {
			wrapper.className += " mmm-hormuz-banner-full-width";
		}

		var title = document.createElement("span");
		title.className = "mmm-hormuz-banner-title";
		title.textContent = this.config.title + ":";
		wrapper.appendChild(title);

		var rows = this.buildRows();

		if (!this.loaded) {
			rows = [{ key: "status", label: this.config.labels.status, value: "Loading" }];
		}

		if (this.payload.error) {
			rows = [{ key: "status", label: this.config.labels.status, value: "unavailable" }];
		}

		rows.forEach(function (row, index) {
			if (index > 0) {
				var separator = document.createElement("span");
				separator.className = "mmm-hormuz-banner-separator";
				separator.textContent = this.config.separator;
				wrapper.appendChild(separator);
			}

			var item = document.createElement("span");
			item.className = "mmm-hormuz-banner-item";

			if (this.shouldShowLabel(row.key)) {
				var label = document.createElement("span");
				label.className = "mmm-hormuz-banner-label";
				label.textContent = row.label + ": ";
				item.appendChild(label);
			}

			var value = document.createElement("span");
			value.className = "mmm-hormuz-banner-value";
			value.textContent = row.value;
			item.appendChild(value);
			wrapper.appendChild(item);
		}, this);

		return wrapper;
	},

	buildRows: function () {
		var rows = [];
		var labels = this.config.labels || {};
		var show = this.config.show || {};

		if (show.status) {
			rows.push({ key: "status", label: labels.status || "Status", value: this.payload.status || "Unknown" });
		}

		if (show.passed24h) {
			rows.push({ key: "passed24h", label: labels.passed24h || "24H Passed", value: this.payload.passed24h || "Unknown" });
		}

		if (show.waiting) {
			rows.push({ key: "waiting", label: labels.waiting || "Waiting", value: this.payload.waiting || "Unknown" });
		}

		if (show.updated) {
			rows.push({ key: "updated", label: labels.updated || "Updated", value: this.formatUpdated(this.payload.updated) });
		}

		return rows;
	},

	shouldShowLabel: function (key) {
		if (typeof this.config.showLabels === "boolean") {
			return this.config.showLabels;
		}

		return Boolean(this.config.showLabels && this.config.showLabels[key]);
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

	scheduleUpdate: function () {
		this.sendSocketNotification("MMM_HORMUZBANNER_FETCH", {
			sourceUrl: this.config.sourceUrl
		});

		var interval = Math.max(5 * 60 * 1000, Number(this.config.updateInterval) || 60 * 60 * 1000);
		setTimeout(this.scheduleUpdate.bind(this), interval);
	},

	socketNotificationReceived: function (notification, payload) {
		if (notification !== "MMM_HORMUZBANNER_DATA") {
			return;
		}

		this.payload = payload || this.payload;
		this.loaded = true;
		this.updateDom(500);
	}
});
