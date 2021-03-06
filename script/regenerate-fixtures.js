/**
 * @author Titus Wormer
 * @copyright 2014-2015 Titus Wormer
 * @license MIT
 * @module parse-dutch:script:regenerate-fixtures
 * @fileoverview Re-generate fixtures.
 */

'use strict';

/* eslint-env node */

/*
 * Dependencies.
 */

var fs = require('fs');
var toString = require('nlcst-to-string');
var ParseDutch = require('..');

/*
 * Parser.
 */

var dutch = new ParseDutch();

/*
 * Find fixtures.
 */

fs.readdirSync('test/fixture').filter(function (name) {
    return name.charAt(0) !== '.';
}).forEach(function (name) {
    var doc = fs.readFileSync('test/fixture/' + name, 'utf8');
    var json = JSON.parse(doc);
    var fn = 'tokenize' + json.type.slice(0, json.type.indexOf('Node'));
    var nlcst;

    if (fn === 'tokenizeRoot') {
        fn = 'parse';
    }

    nlcst = dutch[fn](toString(json));
    nlcst = JSON.stringify(nlcst, 0, 2) + '\n';

    fs.writeFileSync('test/fixture/' + name, nlcst);
});
