"use strict";

/* eslint-env node */
/* globals describe:0, it:0 */

var todotxt = require("../");

var expect = require("expect");


describe("TodoTxt", function () {

  describe("Parser", function () {

    it("should parse empty body", function () {
      expect(todotxt.parse("")).toEqual([]);
    });

    it("should parse line", function () {
      var items = todotxt.parse("Some text");
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toEqual(1);
      var item = items[0];
      expect(typeof item).toBe("object");
      expect(item.text).toEqual("Some text");
    });

    it("should define default values", function () {
      var item = todotxt.parse("Some text")[0];
      // Default values
      expect(item.date).toEqual(null);
      expect(item.complete).toEqual(false);
      expect(item.completeDate).toEqual(null);
      expect(item.priority).toEqual("");
      expect(item.contexts).toEqual([]);
      expect(item.projects).toEqual([]);
    });

    it("should expose methods to handle projects & contexts", function () {
      var item = todotxt.parse("Some text")[0];
      // Default values
      expect(typeof item.addProject).toBe("function");
      expect(typeof item.removeProject).toBe("function");
      expect(typeof item.addContext).toBe("function");
      expect(typeof item.removeContext).toBe("function");
    });

    it("should parse completed task", function () {
      var item = todotxt.parse("x 2015-03-20 2015-03-21 Some text")[0];
      expect(item.text).toEqual("Some text");
      expect(typeof item.date).toBe("object");
      expect(item.date instanceof Date).toEqual(true);
      expect(item.date.getDate()).toEqual(21);
      expect(item.complete).toEqual(true);
      expect(typeof item.date).toBe("object");
      expect(item.date instanceof Date).toEqual(true);
      expect(item.completeDate.getDate()).toEqual(20);
    });

    it("should parse task with priority", function () {
      var item = todotxt.parse("(A) 2015-03-21 Some text")[0];
      expect(item.priority).toEqual("A");
    });

    it("should parse task with everything", function () {
      var item = todotxt.parse("x 2015-03-20 (B) 2015-03-21 Some text with @Context and @Context and again @OtherContext attached to a +Project")[0];
      expect(item.text).toEqual("Some text with @Context and @Context and again @OtherContext attached to a +Project");
      expect(item.priority).toEqual("B");
      expect(item.date.getDate()).toEqual(21);
      expect(item.complete).toEqual(true);
      expect(item.completeDate.getDate()).toEqual(20);
      expect(item.contexts).toEqual(["Context", "OtherContext"]);
      expect(item.projects).toEqual(["Project"]);
    });

    it("should parse multiple lines", function () {
      var items = todotxt.parse("x Complete task\nIncomplete task\nx (A) Complete task with priority\nIncomplete task with +Project");
      expect(items.length).toEqual(4);
      expect(items[0].text).toEqual("Complete task");
      expect(items[0].complete).toEqual(true);
      expect(items[1].text).toEqual("Incomplete task");
      expect(items[1].complete).toEqual(false);
      expect(items[2].text).toEqual("Complete task with priority");
      expect(items[2].priority).toEqual("A");
      expect(items[3].text).toEqual("Incomplete task with +Project");
      expect(items[3].complete).toEqual(false);
    });

    it("should keep empty lines", function () {
      var items = todotxt.parse("Task 1\n\nTask 2");
      expect(items.length).toEqual(3);
      expect(items[0].text).toEqual("Task 1");
      expect(items[2].text).toEqual("Task 2");
    });

    it("should set task's number", function () {
      var items = todotxt.parse("Task 1\n\nTask 2\nTask 3\n\nTask 4");
      expect(items[0].number).toEqual(1);
      expect(items[1]).toEqual(null);
      expect(items[2].number).toEqual(3);
      expect(items[3].number).toEqual(4);
      expect(items[4]).toEqual(null);
      expect(items[5].number).toEqual(6);
    });

  });

  describe("Stringifier", function () {

    var item;

    it("should create item", function () {
      item = todotxt.item({
        "text": "Hello @Context"
      });
    });

    it("should parse context from text", function () {
      expect(item.contexts).toEqual(["Context"]);
    });

    it("should complete task", function () {
      item.complete = true;
      expect(todotxt.stringify(item)).toEqual("x Hello @Context");
    });

    it("should append added contexts", function () {
      item.addContext("Context1");
      item.addContext("Context2");
      expect(todotxt.stringify(item)).toEqual("x Hello @Context @Context1 @Context2");
    });

    it("should remove contexts", function () {
      item.removeContext("Context");
      expect(todotxt.stringify(item)).toEqual("x Hello @Context1 @Context2");
    });

    it("should add project", function () {
      item.addProject("SayHello");
      expect(todotxt.stringify(item)).toEqual("x Hello @Context1 @Context2 +SayHello");
    });

    it("should set completion date", function () {
      item.completeDate = new Date("2015-03-20");
      expect(todotxt.stringify(item)).toEqual("x 2015-03-20 Hello @Context1 @Context2 +SayHello");
    });

    it("should set task date too", function () {
      item.date = new Date("2015-03-18");
      expect(todotxt.stringify(item)).toEqual("x 2015-03-20 2015-03-18 Hello @Context1 @Context2 +SayHello");
    });

    it("should set priority", function () {
      item.priority = "X";
      expect(todotxt.stringify(item)).toEqual("x 2015-03-20 (X) 2015-03-18 Hello @Context1 @Context2 +SayHello");
    });

    it("shoud remove all contexts", function () {
      item.contexts.forEach(item.removeContext);
      expect(todotxt.stringify(item)).toEqual("x 2015-03-20 (X) 2015-03-18 Hello +SayHello");
    });

    it("should uncomplete task (completion date should disappear)", function () {
      item.complete = false;
      expect(todotxt.stringify(item)).toEqual("(X) 2015-03-18 Hello +SayHello");
    });

  });

});
