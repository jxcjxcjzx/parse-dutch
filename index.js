'use strict';

/**
 * Dependencies.
 */

var ParseDutch = require('wooorm/parse-dutch@0.4.0');

/**
 * `parse-dutch`.
 */

var parseDutch = new ParseDutch();

/**
 * DOM elements.
 */

var $input = document.querySelector('.parse-dutch-editor__input');
var $output = document.querySelector('.parse-dutch-output__tree');

/**
 * Current rendered input and selection.
 */

var currentTree;
var currentTextNodes;

/**
 * Tools for invisible characters.
 */

var EXPRESSION_ESCAPE = /(["\\\/\b\f\n\r\t])|([\s\S]+)/g;

var ESCAPE_MAP = {
    '\b' : '\\b',
    '\f' : '\\f',
    '\n' : '\\n',
    '\r' : '\\r',
    '\t' : '\\t'
};

/**
 * Utility to scrol to an element.
 */

function scrollToElementNode(elementNode) {
    var totalOffset = 0,
        ancestorNode;

    ancestorNode = elementNode;

    while (ancestorNode) {
        totalOffset += ancestorNode.offsetTop;

        /* A scrolling parent. */
        if (ancestorNode.offsetTop === 0) {
            totalOffset = elementNode.offsetTop;
            totalOffset -= ancestorNode.offsetHeight / 2;

            ancestorNode.scrollTop = totalOffset;

            return;
        }
        
        ancestorNode = ancestorNode.parentNode;
    }

    /* Untested branch. */

    totalOffset -= window.innerHeight / 2;

    window.scrollTo(0, totalOffset);
}

/**
 * Event handler for caret changes.
 */

function oncaretchange(newPosition) {
    var iterator = -1,
        startOfNode = 0,
        currentSelectedNode, textNodeLength, textNode;
    
    while (textNode = currentTextNodes[++iterator]) {
        textNodeLength = textNode.textContent.length;

        if (textNode.hasAttribute('data-token-value')) {
            textNodeLength = textNode.getAttribute('data-token-value').length;
        }

        if (newPosition <= startOfNode + textNodeLength && newPosition >= startOfNode) {
            currentSelectedNode = currentTree.querySelector('.token--selected');

            if (currentSelectedNode !== textNode) {
                if (currentSelectedNode) {
                    currentSelectedNode.classList.remove('token--selected');
                }

                textNode.classList.add('token--selected');
            }

            scrollToElementNode(textNode);

            break;
        }

        startOfNode += textNodeLength;
    }
}

/**
 * Highlight syntax.
 */

function highlightJSONNameValuePair(name, json) {
    var elementNode = document.createElement('li'),
        nameNode, valueNode;

    elementNode.className = 'token token--name-value';

    nameNode = highlightJSONString(name);
    nameNode.className += ' token__name';
    elementNode.appendChild(nameNode);

    elementNode.appendChild(document.createTextNode(': '));

    valueNode = highlightJSON(json);
    valueNode.className += ' token__value';
    valueNode.setAttribute('data-token-value-name', name);
    elementNode.appendChild(valueNode);

    return elementNode;
}

function highlightJSONValue(json) {
    var elementNode = document.createElement('li');

    elementNode.className = 'token token--value';

    elementNode.appendChild(highlightJSON(json));

    return elementNode;
}

function highlightJSONObject(json) {
    var elementNode = document.createElement('ul'),
        name;

    elementNode.className = 'token token--object';

    for (name in json) {
        elementNode.appendChild(highlightJSONNameValuePair(name, json[name]));
    }

    return elementNode;
}

function highlightJSONArray(json) {
    var elementNode = document.createElement('ol'),
        iterator = -1,
        length = json.length;

    elementNode.className = 'token token--array';

    while (++iterator < length) {
        elementNode.appendChild(highlightJSONValue(json[iterator]));
    }

    return elementNode;
}

function highlightJSONString(json) {
    var elementNode = document.createElement('span');

    elementNode.className = 'token token--string';

    elementNode.setAttribute('data-token-value', json);

    json.replace(EXPRESSION_ESCAPE, function ($0, $1, $2) {
        if ($1) {
            elementNode.appendChild(highlightJSONEscape($1));
        } else {
            elementNode.appendChild(document.createTextNode($2));
        }

        return '';
    });

    return elementNode;
}

function highlightJSONEscape(json) {
    var elementNode = document.createElement('span');

    elementNode.className = 'token token--escape';

    elementNode.textContent = ESCAPE_MAP[json] || '\\' + json;

    return elementNode;
}

function highlightJSONNull(json) {
    var elementNode = document.createElement('span');

    elementNode.className = 'token token--null';

    elementNode.textContent = json;

    return elementNode;
}

function highlightJSONNumber(json) {
    var elementNode = document.createElement('span');

    elementNode.className = 'token token--number';

    elementNode.textContent = json;

    return elementNode;
}

function highlightJSONBoolean(json) {
    var elementNode = document.createElement('span');

    elementNode.className = 'token token--boolean';

    elementNode.textContent = json;

    return elementNode;
}

function highlightJSON(json) {
    if (typeof json === 'object') {
        if (json === null) {
            return highlightJSONNull(json);
        }

        if ('length' in json) {
            return highlightJSONArray(json);
        }

        return highlightJSONObject(json);
    }

    if (typeof json === 'number') {
        return highlightJSONNumber(json);
    }

    if (typeof json === 'boolean') {
        return highlightJSONBoolean(json);
    }

    return highlightJSONString(json);
}

/**
 * Watch the caret.
 */

var caretStartPosition = 0,
    caretEndPosition = 0;

function onpossiblecaretchange() {
    var currentStartPosition = $input.selectionStart,
        currentEndPosition = $input.selectionEnd;

    if (currentStartPosition > currentEndPosition) {
        currentStartPosition = currentEndPosition;
        currentEndPosition = $input.selectionStart;
    }

    if (currentStartPosition !== caretStartPosition) {
        oncaretchange(currentStartPosition);
    } else if (currentEndPosition !== caretEndPosition) {
        oncaretchange(currentEndPosition);
    }

    caretStartPosition = currentStartPosition;
    caretEndPosition = currentEndPosition;
}

/**
 * Set up the output tree element.
 */

function onuserinput() {
    var highlightedSourceCode;

    while ($output.firstChild) {
        $output.removeChild($output.firstChild);
    }

    highlightedSourceCode = highlightJSON(
        parseDutch.tokenizeRoot($input.value)
    );

    highlightedSourceCode.className += ' token--root';

    currentTree = highlightedSourceCode;
    currentTextNodes = highlightedSourceCode.querySelectorAll('[data-token-value-name="value"]');

    $output.appendChild(highlightedSourceCode);
}

/**
 * Attach event handlers.
 */

$input.addEventListener('input', onuserinput);

$input.addEventListener('keyup', onpossiblecaretchange);
$input.addEventListener('keydown', onpossiblecaretchange);
$input.addEventListener('keypress', onpossiblecaretchange);
$input.addEventListener('click', onpossiblecaretchange);
$input.addEventListener('focus', onpossiblecaretchange);

/**
 * Attach event handlers.
 */

onuserinput();

onpossiblecaretchange();
