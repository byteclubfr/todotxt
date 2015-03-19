"use strict";

/* eslint-env node */

var todotxt = require("./");

var items = [
  todotxt.item({
    text: "Hello +Project",
    complete: true
  }),
  null,
  todotxt.item({
    text: "Another task"
  })
];

// You can modify items
items[2].addContext("SomeContext");
items[2].date = new Date("2015-03-20");

console.log(todotxt.stringify(items));

