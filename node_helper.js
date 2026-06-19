var NodeHelper = require("node_helper");
var Log = require("logger");
var http = require("http");
var https = require("https");
var url = require("url");

module.exports = NodeHelper.create({
  start: function () {
    this.config = null;
    this.isFetching = false;
  },

  socketNotificationReceived: function (notification, payload) {
    if (notification === "HORMUZ_CONFIG") {
      this.config = this.cloneConfig(payload);
      this.fetchStatus();
    }

    if (notification === "HORMUZ_REFRESH") {
      this.fetchStatus();
    }
  },

  fetchStatus: function () {
    var self = this;

    if (!this.config) {
      this.sendError("Missing module config");
      return;
    }

    if (this.isFetching) {
      return;
    }

    this.isFetching = true;

    this.fetchText(this.config.sourceUrl || "https://hormuzstraitmonitor.com/")
      .then(function (html) {
        var parsed = self.parsePage(html);
        parsed.sourceUrl = self.config.sourceUrl || "https://hormuzstraitmonitor.com/";
        parsed.updatedAt = new Date().toISOString();
        self.sendSocketNotification("HORMUZ_DATA", parsed);
        self.isFetching = false;
      })
      .catch(function (error) {
        Log.error("MMM-HormuzBanner: " + error.message);
        self.sendError(error.message);
        self.isFetching = false;
      });
  },

  fetchText: function (sourceUrl, redirectCount) {
    var self = this;
    var redirects = redirectCount || 0;

    return new Promise(function (resolve, reject) {
      var parsedUrl;

      try {
        parsedUrl = url.parse(sourceUrl);
      } catch (error) {
        reject(new Error("Invalid Hormuz source URL"));
        return;
      }

      if (!parsedUrl.protocol || !parsedUrl.hostname) {
        reject(new Error("Invalid Hormuz source URL"));
        return;
      }

      var client = parsedUrl.protocol === "http:" ? http : https;
      var request = client.get({
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port,
        path: parsedUrl.path,
        headers: {
          "User-Agent": "MMM-HormuzBanner/1.0 (+https://magicmirror.builders/)",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
        }
      }, function (response) {
        var body = "";

        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          response.resume();

          if (redirects >= 5) {
            reject(new Error("Too many redirects fetching Hormuz source"));
            return;
          }

          resolve(self.fetchText(url.resolve(sourceUrl, response.headers.location), redirects + 1));
          return;
        }

        response.setEncoding("utf8");
        response.on("data", function (chunk) {
          body += chunk;
        });
        response.on("end", function () {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error("Hormuz source returned HTTP " + response.statusCode));
            return;
          }

          resolve(body);
        });
      });

      request.setTimeout(15000, function () {
        request.abort();
        reject(new Error("Hormuz source request timed out"));
      });
      request.on("error", reject);
    });
  },

  cloneConfig: function (payload) {
    var config = {};
    var key;

    payload = payload || {};

    for (key in payload) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        config[key] = payload[key];
      }
    }

    return config;
  },

  parsePage: function (html) {
    var text = this.normalizeText(this.htmlToText(html || ""));

    return {
      status: this.extractStatus(text),
      passed24h: this.extractPassed24h(text),
      waiting: this.extractWaiting(text)
    };
  },

  htmlToText: function (html) {
    return String(html)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&middot;/gi, " ")
      .replace(/&#183;/g, " ")
      .replace(/&#x2f;/gi, "/")
      .replace(/&#47;/g, "/")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/g, "'");
  },

  normalizeText: function (text) {
    return String(text)
      .replace(/\s+/g, " ")
      .trim();
  },

  extractStatus: function (text) {
    var match = text.match(/currently\s+(OPEN|CLOSED|RESTRICTED)/i) ||
      text.match(/status[:\s]+(open|closed|restricted)/i);

    if (!match) {
      return "Unknown";
    }

    return String(match[1]).toUpperCase();
  },

  extractPassed24h: function (text) {
    var exact = text.match(/(?:last|past)\s+24\s*(?:hours?|hrs?|h)[^0-9]{0,80}(\d+\+?|near zero|zero)/i) ||
      text.match(/(\d+\+?|near zero|zero)\s+(?:ships?|vessels?)[^\.]{0,80}(?:last|past)\s+24\s*(?:hours?|hrs?|h)/i) ||
      text.match(/ships?\s+(?:passed|crossings?)[^0-9]*(\d+\+?|near zero|zero)/i);

    if (exact) {
      return this.formatMetric(exact[1]);
    }

    var fallback = text.match(/ships?\s+(?:transiting|passed|crossings?)[^0-9]*(\d+\+?|near zero|zero)/i) ||
      text.match(/(\d+\+?|near zero|zero)\s+(?:ships?|vessels?)[^\.]{0,80}(?:transiting|passed|crossings?)/i);

    return fallback ? this.formatMetric(fallback[1]) : "Unknown";
  },

  extractWaiting: function (text) {
    var match = text.match(/(?:stranded|waiting)\s+vessels?[^0-9]*(\d+\+?)/i) ||
      text.match(/(\d+\+?)\s+(?:ships|vessels).{0,40}(?:waiting|stranded)/i) ||
      text.match(/(?:ships?|vessels?)\s+(?:waiting|stranded)[^0-9]*(\d+\+?)/i);

    return match ? this.formatMetric(match[1]) : "Unknown";
  },

  formatMetric: function (value) {
    var normalized = String(value || "").trim();

    if (/^near zero$/i.test(normalized)) {
      return "Near zero";
    }

    if (/^zero$/i.test(normalized)) {
      return "0";
    }

    return normalized || "Unknown";
  },

  sendError: function (message) {
    this.sendSocketNotification("HORMUZ_ERROR", {
      message: message || "unavailable"
    });
  }
});
