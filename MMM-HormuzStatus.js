/* global Module */

Module.register("MMM-HormuzStatus", {
  defaults: {
    sourceUrl: "https://hormuzstraitmonitor.com/",
    updateInterval: 60 * 60 * 1000,
    fetchEnabled: true,
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
    }
  },

  start: function () {
    this.loaded = false;
    this.data = null;
    this.error = null;
    this.timer = null;

    if (this.config.fetchEnabled === false) {
      this.loaded = true;
      this.data = {
        status: "Unknown",
        passed24h: "Unknown",
        waiting: "Unknown"
      };
      return;
    }

    this.sendSocketNotification("HORMUZ_STATUS_CONFIG", this.config);
    this.scheduleUpdate();
  },

  getStyles: function () {
    return ["MMM-HormuzStatus.css"];
  },

  scheduleUpdate: function () {
    var self = this;
    var interval = Math.max(Number(this.config.updateInterval) || this.defaults.updateInterval, 60 * 1000);

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(function () {
      self.sendSocketNotification("HORMUZ_STATUS_REFRESH");
    }, interval);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "HORMUZ_STATUS_DATA") {
      this.loaded = true;
      this.data = payload;
      this.error = null;
      this.updateDom(300);
    }

    if (notification === "HORMUZ_STATUS_ERROR") {
      this.loaded = true;
      this.data = null;
      this.error = payload || { message: "unavailable" };
      this.updateDom(300);
    }
  },

  getDom: function () {
    var wrapper = document.createElement("div");
    wrapper.className = "mmm-hormuz-status";

    var title = document.createElement("div");
    title.className = "hormuz-status-title small dimmed";
    title.innerHTML = this.escapeHtml(this.config.title || this.defaults.title);
    wrapper.appendChild(title);

    if (!this.loaded) {
      wrapper.appendChild(this.makeStatus("Loading..."));
      return wrapper;
    }

    if (this.error) {
      wrapper.appendChild(this.makeStatus("unavailable"));
      return wrapper;
    }

    if (this.isVisible("status")) {
      var current = document.createElement("div");
      current.className = "hormuz-status-current bright";
      current.innerHTML = this.escapeHtml(this.formatValue((this.data || {}).status));
      wrapper.appendChild(current);
    }

    var table = this.makeDetailsTable();

    if (table.childNodes.length > 0) {
      wrapper.appendChild(table);
    }

    if (!this.isVisible("status") && table.childNodes.length === 0) {
      wrapper.appendChild(this.makeStatus("No rows enabled"));
    }

    return wrapper;
  },

  makeDetailsTable: function () {
    var values = this.data || {};
    var table = document.createElement("table");
    table.className = "hormuz-status-details small";

    if (this.isVisible("passed24h")) {
      table.appendChild(this.makeRow(this.getLabel("passed24h"), this.formatValue(values.passed24h)));
    }

    if (this.isVisible("waiting")) {
      table.appendChild(this.makeRow(this.getLabel("waiting"), this.formatValue(values.waiting)));
    }

    if (this.isVisible("updated")) {
      table.appendChild(this.makeRow(this.getLabel("updated"), this.formatUpdated(values.updatedAt)));
    }

    return table;
  },

  makeRow: function (labelText, valueText) {
    var row = document.createElement("tr");
    var label = document.createElement("td");
    var value = document.createElement("td");

    label.className = "hormuz-status-label dimmed";
    value.className = "hormuz-status-value bright";
    label.innerHTML = this.escapeHtml(labelText);
    value.innerHTML = this.escapeHtml(valueText);

    row.appendChild(label);
    row.appendChild(value);

    return row;
  },

  makeStatus: function (message) {
    var status = document.createElement("div");
    status.className = "hormuz-status-message small bright";
    status.innerHTML = this.escapeHtml(message);
    return status;
  },

  getLabel: function (key) {
    if (this.config.labels && this.config.labels[key] !== undefined) {
      return this.config.labels[key];
    }

    if (this.defaults.labels[key] !== undefined) {
      return this.defaults.labels[key];
    }

    return key;
  },

  isVisible: function (key) {
    if (this.config.show && this.config.show[key] !== undefined) {
      return Boolean(this.config.show[key]);
    }

    if (this.defaults.show[key] !== undefined) {
      return Boolean(this.defaults.show[key]);
    }

    return true;
  },

  formatValue: function (value) {
    if (value === null || value === undefined || value === "") {
      return "Unknown";
    }

    return String(value);
  },

  formatUpdated: function (updatedAt) {
    if (!updatedAt) {
      return "Unknown";
    }

    var date = new Date(updatedAt);

    if (Number.isNaN(date.getTime())) {
      return "Unknown";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  },

  escapeHtml: function (value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
});
