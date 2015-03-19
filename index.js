"use strict";

/* eslint-env node */
/* eslint no-use-before-define:0 */

var _ = require("lodash");


module.exports = {
  "parse": parse,
  "stringify": stringify,
  "item": todoItem
};


var DEFAULT_ENCODING = "utf8";

var RE_COMPLETE = /^x\s+/;
var RE_PRIORITY = /^\(([A-Z])\)\s+/;
var RE_DATE = /^(\d{4}-\d{2}-\d{2})\s+/;

var RE_CONTEXT_AND_PROJECT = /\s([@\+])(\S+)/g;


function parse (lines, encoding) {
  if (Array.isArray(lines)) {
    return lines.map(function (line, index) {
      return parseLine(line, index + 1, encoding || DEFAULT_ENCODING);
    });
  }

  if (Buffer.isBuffer(lines)) {
    return parse(lines.toString(encoding || DEFAULT_ENCODING));
  }

  var content = lines.trim();

  if (!content) {
    return [];
  }

  return parse(content.split(/\r?\n/));
}

function parseLine (line, number, encoding) {
  if (Buffer.isBuffer(line)) {
    line = line.toString(encoding || DEFAULT_ENCODING);
  }

  line = line.trim();

  if (!line) {
    return null;
  }

  var props = {
    "number": number,
    "complete": false,
    "completeDate": null,
    "priority": "",
    "date": null, // Date
    "text": ""
  };

  // Complete?
  line = regexTrimLeft(line, RE_COMPLETE, function () {
    props.complete = true;
  });

  if (props.complete) {
    // Completion date?
    line = regexTrimLeft(line, RE_DATE, function (m) {
      props.completeDate = parseDate(m[1]);
      props.prout = true;
    });
  }

  // Priority?
  line = regexTrimLeft(line, RE_PRIORITY, function (m) {
    props.priority = m[1];
  });

  // Date?
  line = regexTrimLeft(line, RE_DATE, function (m) {
    props.date = parseDate(m[1]);
  });

  // Text = whatever remains
  props.text = line;

  return todoItem(props);
}

function todoItem (props) {
  // Extract contexts and projects
  var cp = parseContextsAndProjects(props.text || "");

  var item = {
    "number": props.number,
    "complete": Boolean(props.complete),
    "completeDate": (!props.completeDate || (props.completeDate instanceof Date)) ? props.completeDate : parseDate(props.completeDate),
    "priority": props.priority || "",
    "date": (!props.date || (props.date instanceof Date)) ? props.date : parseDate(props.date),
    "text": props.text || "",
    "contexts": cp.contexts,
    "projects": cp.projects,
    // Methods
    "addContext": addContext,
    "removeContext": removeContext,
    "addProject": addProject,
    "removeProject": removeProject
  };

  function addContext (context) {
    if (item.contexts.indexOf(context) === -1) {
      item.contexts.push(context);
      item.text = addTag(item.text, "@" + context);
    }
  }

  function addProject (project) {
    if (item.projects.indexOf(project) === -1) {
      item.projects.push(project);
      item.text = addTag(item.text, "+" + project);
    }
  }

  function removeContext (context) {
    if (item.contexts.indexOf(context) !== -1) {
      item.contexts = _.without(item.contexts, context);
      item.text = removeTag(item.text, "@" + context);
    }
  }

  function removeProject (project) {
    if (item.projects.indexOf(project) !== -1) {
      item.projects = _.without(item.projects, project);
      item.text = removeTag(item.text, "@" + project);
    }
  }

  return item;
}

function addTag (text, tag) {
  if ((text + " ").indexOf(" " + tag + " ") === -1) {
    text += " " + tag;
  }

  return text;
}

function removeTag (text, tag) {
  var found;
  do {
    found = (text + " ").indexOf(" " + tag + " ");
    if (found !== -1) {
      text = text.substring(0, found) + text.substring(found + tag.length + 1);
    }
  } while (found !== -1);

  return text;
}


function regexMatchAll (string, pattern) {
  var matches = [];

  var current;
  do {
    current = pattern.exec(string);
    if (current) {
      matches.push(current);
    }
  } while (current);

  return matches;
}

function parseDate (string) {
  return new Date(string);
}

function regexTrimLeft (string, pattern, onMatch) {
  var match = string.match(pattern);

  if (match) {
    onMatch(match);

    // Trim
    string = string.substring(match[0].length);
  }

  return string;
}

function parseContextsAndProjects (string) {
  var contexts = [];
  var projects = [];

  // Allow starting with a context or project
  regexMatchAll(" " + string, RE_CONTEXT_AND_PROJECT).forEach(function (match) {
    if (match[1] === "@") {
      if (contexts.indexOf(match[2]) === -1) {
        contexts.push(match[2]);
      }
    } else if (match[1] === "+") {
      if (projects.indexOf(match[2]) === -1) {
        projects.push(match[2]);
      }
    }
  });

  return {
    "contexts": contexts,
    "projects": projects
  };
}


function stringify (items) {
  if (Array.isArray(items)) {
    return items.map(stringifyItem).join("\n");
  } else if (typeof items === "object" && isItemsList(items)) {
    return stringify(itemsListAsArray(items));
  } else if (typeof items === "object" && isItem(items)) {
    return stringifyItem(items);
  } else {
    throw new Error("Unexpected input: should be a TodoTxt item or list of TodoTxt items");
  }
}

function stringifyItem (item) {
  if (!item) {
    return null;
  }

  var line = "";

  // Complete?
  if (item.complete) {
    line += "x ";

    // Completion date?
    if (item.completeDate) {
      line += stringifyDate(item.completeDate) + " ";
    }
  }

  // Priority?
  if (item.priority) {
    line += "(" + item.priority + ") ";
  }

  // Date?
  if (item.date) {
    line += stringifyDate(item.date) + " ";
  }

  // Main content
  line += item.text;

  return line;
}

function isItemsList (object) {
  return Object.keys(object).every(function isItemListKey (key) {
    // Key must be a number
    if (!isNaN(Number(key))) {
      return false;
    }
    // Value must be an item
    return isItem(object[key]);
  });
}

function isItem (object) {
  return typeof object === "object"
      && "complete" in object
      && "completeDate" in object
      && "priority" in object
      && "date" in object
      && "text" in object
      && "contexts" in object
      && "projects" in object;
}

function itemsListAsArray (object) {
  var result = [];

  // copy object values as array values
  for (var key in object) {
    result[Number(key)] = object;
  }

  // fill gaps with null
  for (var i = 0; i < result.length; i++) {
    if (!result[i]) {
      result[i] = null;
    }
  }

  return result;
}

function stringifyDate (date) {
  if (typeof date === "string") {
    return date;
  }

  if (!(date instanceof Date)) {
    throw new Error("Invalid date value");
  }

  var yyyy = String(date.getFullYear());

  var mm = String(date.getMonth() + 1);
  if (mm.length === 1) {
    mm = "0" + mm;
  }

  var dd = String(date.getDate());
  if (dd.length === 1) {
    dd = "0" + dd;
  }

  return yyyy + "-" + mm + "-" + dd;
}

