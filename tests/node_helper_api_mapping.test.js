var assert = require("assert");
var Module = require("module");

var originalLoad = Module._load;

Module._load = function (request, parent, isMain) {
  if (request === "node_helper") {
    return {
      create: function (helper) {
        return helper;
      }
    };
  }

  if (request === "logger") {
    return {
      info: function () {},
      warn: function () {},
      error: function () {}
    };
  }

  return originalLoad.call(this, request, parent, isMain);
};

var helper = require("../node_helper");

assert.deepStrictEqual(helper.mapDashboardApi({
  data: {
    straitStatus: {
      status: "RESTRICTED"
    },
    shipCount: {
      last24h: 35
    },
    strandedVessels: {
      total: 0
    }
  }
}), {
  status: "RESTRICTED",
  passed24h: "35",
  waiting: "Data not available"
});

assert.deepStrictEqual(helper.mapDashboardApi({
  data: {
    straitStatus: {
      status: "open"
    },
    shipCount: {
      last24h: 12
    },
    strandedVessels: {
      total: 8
    }
  }
}), {
  status: "OPEN",
  passed24h: "12",
  waiting: "8"
});

assert.throws(function () {
  helper.mapDashboardApi({
    data: {
      straitStatus: {
        status: "RESTRICTED"
      },
      strandedVessels: {
        total: 0
      }
    }
  });
}, /shipCount\.last24h/);

assert.throws(function () {
  helper.parseDashboardApi("<html></html>");
}, /non-JSON/);

Module._load = originalLoad;

console.log("node_helper API mapping tests passed");
