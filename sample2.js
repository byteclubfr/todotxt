"use strict";

/* eslint-env node */

var todotxt = require("./");

var items = todotxt.parse("Hello @Home @Alone\n" +
"Hello (2)\n" +
"\n" +
"Hello (again) @Home +Project1 +Project2\n" +
"\n" +
"First task\n" +
"x 2015-03-19 Second task\n" +
"(A) Third task\n" +
"2015-03-17 another task\n");

items.forEach(function (item) {
  if (!item) {
    console.log("    // deleted task");
  } else if (item.complete) {
    console.log("[x] Complete task:", item.text);
  } else {
    console.log("[ ] Incomplete task:", item.text);
  }
});

