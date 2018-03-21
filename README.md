[![Build Status](https://img.shields.io/travis/byteclubfr/todotxt/master.svg?style=flat)](https://travis-ci.org/byteclubfr/todotxt)
[![Dependency Status](https://david-dm.org/byteclubfr/todotxt.svg?style=flat)](https://david-dm.org/byteclubfr/todotxt)
[![devDependency Status](https://david-dm.org/byteclubfr/todotxt/dev-status.svg?style=flat)](https://david-dm.org/byteclubfr/todotxt#info=devDependencies)

# TodoTxt

[Todo.txt](http://todotxt.com) parser/serializer for Node and io.js.

## API

```js
// npm install --save todotxt

var todotxt = require("todotxt");

todotxt.parse("string or buffer"); // -> [items]
todotxt.stringify([items] or item); // -> string
todotxt.item(properties); // item
```

## Sample usage

### Parse file

sample todo:

```
Hello @Home @Alone
Hello (2)

Hello (again) @Home +Project1 +Project2

First task
x 2015-03-19 Second task
(A) Third task
2015-03-17 another task
```

```js
var items = todotxt.parse(fs.readFileSync("./todo.txt"));

items.forEach(function (item) {
  if (!item) {
    console.log("    // deleted task");
  } else if (item.complete) {
    console.log("[x] Complete task:", item.text);
  } else {
    console.log("[ ] Incomplete task:", item.text);
  }
});
```

output:

```
[ ] Incomplete task: Hello @Home @Alone
[ ] Incomplete task: Hello (2)
    // deleted task
[ ] Incomplete task: Hello (again) @Home +Project1 +Project2
    // deleted task
[ ] Incomplete task: First task
[x] Complete task: Second task
[ ] Incomplete task: Third task
[ ] Incomplete task: another task
```

### Stringify items

```js
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
items[1].addContext("SomeContext");
items[1].date = new Date("2015-03-20");

console.log(todotxt.stringify(items));
```

output:

```
x Hello +Project

2015-03-20 Another task @SomeContext
```
