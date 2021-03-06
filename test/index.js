/**
 * @author Titus Wormer
 * @copyright 2014-2015 Titus Wormer
 * @license MIT
 * @module parse-dutch:test
 * @fileoverview Test suite for `parse-dutch`.
 */

'use strict';

/* eslint-env node */
/* jscs:disable jsDoc */
/* jscs:disable maximumLineLength */

/* Dependencies. */
var test = require('tape');
var nlcstTest = require('nlcst-test');
var VFile = require('vfile');
var ParseDutch = require('..');

/* `ParseDutch`. */
var dutch = new ParseDutch();

var dutchNoPosition = new ParseDutch({
    position: false
});

/**
 * Clone `object` but omit positional information.
 *
 * @param {Object|Array} object - Object to clone.
 * @return {Object|Array} - `object`, without positional
 *   information.
 */
function clean(object) {
    var clone = 'length' in object ? [] : {};
    var key;
    var value;

    for (key in object) {
        value = object[key];

        if (key === 'position') {
            continue;
        }

        clone[key] = typeof object[key] === 'object' ? clean(value) : value;
    }

    return clone;
}

/**
 * Utility to test if a given document is both a valid
 * node, and matches a fixture.
 *
 * @param {string} name - Filename of fixture.
 * @param {string} document - Source to validate.
 * @param {string} method - Method to use.
 */
function describeFixture(t, name, doc, method) {
    var nlcstA = dutch[method || 'parse'](doc);
    var nlcstB = dutchNoPosition[method || 'parse'](doc);
    var fixture = require('./fixture/' + name);

    nlcstTest(nlcstA);
    nlcstTest(nlcstB);

    t.deepEqual(nlcstA, fixture, 'should match w/ position');
    t.deepEqual(nlcstB, clean(fixture), 'should match w/o position');
}

/* Tests. */
test('ParseDutch', function (t) {
    t.equal(typeof ParseDutch, 'function', 'should be a `function`');

    t.ok(new ParseDutch() instanceof ParseDutch, 'should instantiate');

    t.ok(ParseDutch() instanceof ParseDutch, 'should instantiate (#2)');

    t.equal(new ParseDutch().position, true, 'should set `position`');

    t.equal(new ParseDutch({
        position: true
    }).position, true, 'should support `position: true`');

    t.equal(new ParseDutch({
        position: false
    }).position, false, 'should support `position: false`');

    t.deepEqual(
        new ParseDutch(new VFile('Alpha bravo charlie')).parse(),
        dutch.parse('Alpha bravo charlie'),
        'should accept a vfile'
    );

    t.end();
});

test('Abbreviations', function (t) {
    t.test('should NOT treat Dutch abbreviations as a terminal marker',
        function (st) {
            /*
             * Note: This paragraph also tests for
             * coverage of early break branches in the
             * `mergeDutchPrefixExceptions` function.
             *
             * These should probably be tested by running
             * `ParseLatin` specs.
             */

            describeFixture(
                st,
                'abbreviations',
                'St. Augustinus. Enquête! (Herbevestigt). Z. Em. de ' +
                'Hoogwaardige Heer. Een andere zin!'
            );

            st.end();
        }
    );

    t.end();
});

test('Elision', function (t) {
    t.test('should treat `\'s` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-s',
            '\'s-Gravenhage. \u2019s Ochtends!'
        );

        st.end();
    });

    t.test('should treat `\'t` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-t',
            '\'t Kofschip. \u2019t Kofschip!'
        );

        st.end();
    });

    t.test('should treat `\'n` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-n',
            '\'n Liedje. \u2019n Liedje!'
        );

        st.end();
    });

    t.test('should treat `\'ns` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-ns',
            'Kom \'ns? Kom \u2019ns!'
        );

        st.end();
    });

    t.test('should treat `\'er` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-er',
            'Wanneer heb je \'er voor het laatst gezien?'
        );

        describeFixture(
            st,
            'elision-initial-er-smart',
            'Wanneer heb je \u2019er voor het laatst gezien?'
        );

        st.end();
    });

    t.test('should treat `\'em` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-em',
            'Wanneer heb je \'em voor het laatst gezien?'
        );

        describeFixture(
            st,
            'elision-initial-em-smart',
            'Wanneer heb je \u2019em voor het laatst gezien?'
        );

        st.end();
    });

    t.test('should treat `\'ie` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-ie',
            'Wat deed \'ie?'
        );

        describeFixture(
            st,
            'elision-initial-ie-smart',
            'Wat deed \u2019ie?'
        );

        st.end();
    });

    t.test('should treat `\'tis` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-tis',
            '\'Tis leuk!'
        );

        describeFixture(
            st,
            'elision-initial-tis-smart',
            '\u2019Tis leuk!'
        );

        st.end();
    });

    t.test('should treat `\'twas` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-twas',
            '\'Twas leuk!'
        );

        describeFixture(
            st,
            'elision-initial-twas-smart',
            '\u2019Twas leuk!'
        );

        st.end();
    });

    t.test('should treat `\'70s` as one word', function (st) {
        describeFixture(
            st,
            'elision-initial-year',
            'That \'70s Show.'
        );

        describeFixture(
            st,
            'elision-initial-year-smart',
            'That \u201970s Show.'
        );

        st.end();
    });

    t.test('should treat `d\'` as one word', function (st) {
        /*
         * Note: This paragraph also tests for
         * coverage of the last branch in the
         * `mergeDutchElisionExceptions` function.
         *
         * These should probably be tested by running
         * `ParseLatin` specs.
         */

        describeFixture(
            st,
            'elision-final-d',
            'D\' eedlen\'s.'
        );

        describeFixture(
            st,
            'elision-final-d-smart',
            'D\u2019 eedlen\u2019s.'
        );

        st.end();
    });

    t.test('should NOT treat other initial apostrophes as word', function (st) {
        describeFixture(
            st,
            'elision-non-initial',
            'Bijvoorbeeld iets als \'de voorgaande.'
        );

        /*
         * This is commented out because `parse-latin`
         * always thinks apostrophes at the start of
         * a word are part of that word.
         */

        /*
         * describeFixture(
         *     'elision-non-initial-smart',
         *     'Bijvoorbeeld iets als \u2019de voorgaande.'
         * );
         */

        st.end();
    });

    t.test('should NOT treat other final apostrophes as word', function (st) {
        describeFixture(
            st,
            'elision-non-final',
            'Bijvoorbeeld iets als\' de voorgaande.'
        );

        describeFixture(
            st,
            'elision-non-final-smart',
            'Bijvoorbeeld iets als\u2019 de voorgaande.'
        );

        st.end();
    });

    t.end();
});
