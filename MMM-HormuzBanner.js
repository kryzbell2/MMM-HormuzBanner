/* global Module */

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
    }
  },

  start: function () {
    this.loaded = false;
    this.data = null;
    this.error = null;
    this.timer = null;

    this.sendSocketNotification("HORMUZ_CONFIG", this.config);
    this.scheduleUpdate();
  },

  getStyles: function () {
    return ["MMM-HormuzBanner.css"];
  },

  scheduleUpdate: function () {
    var self = this;
    var interval = Math.max(Number(this.config.updateInterval) || this.defaults.updateInterval, 60 * 1000);

    if (this.timer) {
      clearInterval(this.timer);
    }

    this.timer = setInterval(function () {
      self.sendSocketNotification("HORMUZ_REFRESH");
    }, interval);
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "HORMUZ_DATA") {
      this.loaded = true;
      this.data = payload;
      this.error = null;
      this.updateDom(300);
    }

    if (notification === "HORMUZ_ERROR") {
      this.loaded = true;
      this.data = null;
      this.error = payload || { message: "unavailable" };
      this.updateDom(300);
    }
  },

  getDom: function () {
    var wrapper = document.createElement("div");
    wrapper.className = "mmm-hormuz-banner";

    var title = document.createElement("span");
    title.className = "hormuz-title bright";
    title.innerHTML = this.escapeHtml(this.config.title || this.defaults.title) + ":";
    wrapper.appendChild(title);

    if (!this.loaded) {
      wrapper.appendChild(this.makeSegment("Loading"));
      return wrapper;
    }

    if (this.error) {
      wrapper.appendChild(this.makeSegment("unavailable"));
      return wrapper;
    }

    var segments = this.getVisibleSegments();

    for (var i = 0; i < segments.length; i += 1) {
      if (i > 0) {
        wrapper.appendChild(this.makeSeparator());
      }

      wrapper.appendChild(this.makeSegment(segments[i].value, segments[i].label));
    }

    if (segments.length === 0) {
      wrapper.appendChild(this.makeSegment("No rows enabled"));
    }

    return wrapper;
  },

  getVisibleSegments: function () {
    var values = this.data || {};
    var segments = [];

    if (this.isVisible("status")) {
      segments.push({
        label: null,
        value: this.formatValue(values.status)
      });
    }

    if (this.isVisible("passed24h")) {
      segments.push({
        label: this.getLabel("passed24h"),
        value: this.formatValue(values.passed24h)
      });
    }

    if (this.isVisible("waiting")) {
      segments.push({
        label: this.getLabel("waiting"),
        value: this.formatValue(values.waiting)
      });
    }

    if (this.isVisible("updated")) {
      segments.push({
        label: this.getLabel("updated"),
        value: this.formatUpdated(values.updatedAt)
      });
    }

    return segments;
  },

  makeSegment: function (value, label) {
    var segment = document.createElement("span");
    segment.className = "hormuz-segment";

    if (label) {
      var segmentLabel = document.createElement("span");
      segmentLabel.className = "hormuz-label dimmed";
      segmentLabel.innerHTML = this.escapeHtml(label) + ": ";
      segment.appendChild(segmentLabel);
    }

    var segmentValue = document.createElement("span");
    segmentValue.className = "hormuz-value bright";
    segmentValue.innerHTML = this.escapeHtml(value);
    segment.appendChild(segmentValue);

    return segment;
  },

  makeSeparator: function () {
    var separator = document.createElement("span");
    separator.className = "hormuz-separator dimmed";
    separator.innerHTML = "&middot;";
    return separator;
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
