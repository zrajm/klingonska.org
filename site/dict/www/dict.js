/*-*- js-indent-level: 2 -*-*/
// Copyright 2025 by zrajm. Licenses: CC BY-SA (text), GPLv2 (code).

import './tips.js'
import { quotecurl } from './quotecurl.mjs'

function handleForm(formTag, changeHook) {
  let oldUrlStr = ''

  // Update form to reflect state of <params>.
  function fillForm(params) {
    const formState = new FormData(formTag)
    const  urlState = new URLSearchParams(params)
    for (const [key] of formState) {
      formTag.elements[key].value = urlState.get(key) ?? ''
    }
    return urlState
  }
  // Update form to reflect state of URL.
  function updateForm() {
    changeHook(fillForm(location.search))
  }
  // Update URL to reflect state of form (doesn't reload page).
  function updateUrl() {
    const formState = new FormData(formTag)
    const newUrlStr = `?${new URLSearchParams(formState)}`
    if (newUrlStr !== oldUrlStr) {
      history.pushState(null, '', oldUrlStr = newUrlStr)
      changeHook(formState)
    }
  }
  addEventListener('DOMContentLoaded', updateForm)
  addEventListener('popstate',         updateForm)
  formTag.addEventListener('submit', evt => {
    evt.preventDefault()
    updateUrl()
  })
  // When a link is clicked on.
  document.addEventListener('click', evt => {
    const href = evt.target.closest('a')?.getAttribute('href') ?? ''
    if (href[0] === '?') {
      evt.preventDefault()
      fillForm(href) // fill in form (don't search)
      updateUrl()    // update URL (from form) and search
    }
  })
}

/** Dictonary stuff. **/

function parseDict(txt) {
  const [_, data] = /^== start-of-data ==\n(.*)\n== end-of-data ==$/sm
    .exec(txt)
  return data.split(/\n{2,}/)
    .filter(x => !/^===/.test(x)) // strip '=== end-of-word-list ===' etc
    .map(parseDictEntry)
}

function parseDictEntry(txtEntry) {
  let entry = {}, match, endAt, fieldRegex = /^([a-z]+):((\t.*(?:\n|$))+)/my
  while (match = fieldRegex.exec(txtEntry)) {
    const [_, fieldName, fieldValue] = match
    entry[fieldName] = fieldValue
      .replace(/^\t/gm, '')        // tab at start of each line
      .replace(/\n$/g, '')         // trailing newline
      .replace(/\n+/g, ' ')        // replace newline (elsewhere) with space
      .replace(/[<>«»]/g, '')      // strip '<>«»'
      .replace(/\s*¶\s*/g, '\n\n') // ¶ -> blank line
    endAt = fieldRegex.lastIndex
  }
  if (endAt !== txtEntry.length) {
    console.error('Syntax error in entry:\n', txtEntry.replace(/^/gm, '  '))
  }
  return entry
}

/*****************************************************************************/

// Test if char is 0-9, a-ö or apostrophes.
const wordCharRe = /^[\p{Letter}\p{Number}‘’']$/u

// Unquoted special characters: Expand unquoted char into character class.
let charClass = {
  "'": "(?:['‘’]",
  'x': '(?:x|tlh)',
  'f': '(?:f|ng)',
  'c': '(?:c|ch)',
  'g': '(?:g|gh)',
  'z': "[z']",
}

function finalizeTerm(state) {
  'use strict'
  const {
    plain = '',
    regex = '',
    field = false,
    not = false,
    tag = false,
    wordBeg, wordEnd,
  } = state
  function wordRegex(regex) {
    // One <betweenWord> must match before & after search word.
    const betweenWord = /[^\p{Letter}\p{Number}‘’']/u
    return (wordBeg ? `(^|${betweenWord.source})` : '()')
      + `(${regex})`
      + (wordEnd ? `(?=${betweenWord.source}|$)` : '')
  }
  return {
    regex: regex
      ? RegExp(field ? `^${regex}$` : wordRegex(regex), 'ui')
      : null,
    plain, not, tag,
  }
}

// Parse user's query string, return QUERY object with following root methods:
//
// * hilite():        Return regex for highlighting matches in output.
// * search(ENTRIES): Return list entries matching query. ENTRIES is list where
//                    each entry is a list of fields; each field is a string.
//                    (ie a list-of-lists, but depth does not vary.)
//
// QUERY also contains a nested list of search terms (regexes with 'g' and 'y'
// flags UNSET, and the added property 'not'). Multiple terms are wrapped in
// (possibly nested) lists (with added properties 'not', 'or' and 'own'). Added
// properties indicate: 'not' = mark that item must NOT be be found to match;
// 'or' = subitems in list are OR:ed, rather than AND:ed; 'own' = list
// correspond to a parethesis entered in query by user (user-entered/explicit
// paretheses are removed if redundant, and implicit lists are added to
// disambiguate order of AND/OR precedence).
//
// Query parsing is sloppy = all input is valid (eg incomplete parentheses and
// quotes). Operator precedence is: NOT -> AND -> OR (`a, -b c` = `a, (-b c)`).
function parseQuery(queryStr) {
  'use strict'
  let query = (() => {
    function p(x) {
      return x.split(' ').reduce((a, p) => { a[p] = true; return a }, [])
    }
    function and_() { return p('') }
    function or_() { return p('or') }
    function or() { return p('or own') }
    function nor() { return p('or own not') }

    let q = [[]]  // query stack
    add(or_())
    add(and_())

    function add(x) {  // add new parenthesis
      q[q.length - 1].push(x)
      if (Array.isArray(x)) { q.push(x) }
    }
    function end() {   // end parenthesis
      let z = q.pop()          // pop last paren on stack
      let p = q[q.length - 1]  // parent paren
      // Cleanup: Remove empty parens, and parens around single terms.
      switch (z.length) {
      case 0:
        p.pop()
        break
      case 1:
        let [c] = z                 // eslint-disable-line no-case-declarations
        c.own = !!(c.own || z.own)  // OR
        c.not = !!(c.not ^ z.not)   // XOR
        p[p.length - 1] = c
      }
      // Cleanup: Remove parens around children with same AND/OR as parent.
      z.forEach((c, i) => {
        // c.length is always >1 here (cleaned up above)
        //
        // Process children (c) of current parenthesis (z) here, since AND/OR
        // status of child's parent must be known. (The current parenthesis
        // will not have AND/OR set for first item, since comma/space which
        // specifies this comes AFTER first item in the query language.)
        if (Array.isArray(c) && (z.or === c.or && !c.not)) {
          z.splice(i, 1, ...c)
        }
      })
    }
    function wrap() {  // wrap query in extra paren
      if (Array.isArray(q[0])) {
        q[0].own = true
        q.unshift([q[0]])
        q.unshift([q[0]])
        q[0].or = true
        q.unshift([q[0]])
      }
    }
    function done() {
      while (q.length > 1) { end() }  // trim all remaining parens

      // FIXME: Why is this necessary? Can this be handled by end()?
      if (q[0].length === 1 && Array.isArray(q[0][0])) {
        let [z] = q
        let [c] = z
        c.own = !!(c.own || z.own)  // OR
        c.not = !!(c.not ^ z.not)   // XOR
        q[0] = c
      }
    }

    function addParen(not) {
      add(not ? nor() : or())
      add(and_())
    }
    function endParen() {
      while (q.length > 1 && !q[q.length - 1].own) { end() }  // trim all parens
      if (q.length === 1) { wrap() }
      end()
    }
    function orParen() {
      end()
      add(and_())
    }
    function addTerm(cb) {
      const { regex, plain, not, tag } = cb()
      if (regex) { add(Object.assign(regex, { not, plain, tag })) }
      return this
    }
    // Test if single entry 'e' (list of strings) match query (<q>). Return
    // true on match, false otherwise.
    function searchEntry(query, entry) {
      return (
        // FIXME: This should work
        Array.isArray(query)
          ? (query[query.or ? 'some' : 'every']( // subquery
            q => searchEntry(q, entry)))
          : Object.entries(entry)
              .some(([fieldName, fieldValue]) => { // base case
                const match = query.test(fieldValue)
                // FIXME: test tag name
                return query.test(fieldValue)
              })
      ) === !!query.not
    }
    function flat(q) {
      return q.reduce(
        (a, q) => a.concat(Array.isArray(q) ? flat(q) : q.source), [])
    }
    function get() {
      done()
      let x = q[q.length - 1]
      return Object.assign(x, {
        // NOTE: Keep negated terms in hilite() (since '-(-a,-b)' match 'a b').
        hilite: () => RegExp(flat(x).join('|'), 'gui'),
        search: e => x.length ? e.filter(e => searchEntry(x, e)) : [],
      })
    }
    return { addTerm, addParen, endParen, orParen, get }
  })()
  let fsa = {
    '(': s => { query.addTerm(() => finalizeTerm(s)).addParen(s.not) },
    ')': s => { query.addTerm(() => finalizeTerm(s)).endParen() },
    ',': s => { query.addTerm(() => finalizeTerm(s)).orParen() },
    ' ': s => { query.addTerm(() => finalizeTerm(s)) },
    '"': (s, c) => { s.quote = c; return s },
    "'": (s, c) => { s.quote = c; return s },
    'QUOTED': (s, c) => {
      if (c === s.quote) {
        delete s.quote
      } else {
        s.regex = (s.regex || '') + escape(c)
        s.plain = (s.plain || '') + c
        s.wordEnd   = wordCharRe.test(c)
        s.wordBeg ??= s.wordEnd
      }
      return s
    },
    'UNQUOTED': (s, c) => {
      if (!s.regex) {            // before word
        if (c === '-') {         //  '-' negated
          s.not = !s.not
          return s
        } else if (c === '=') {  //  '=' match whole field
          s.field = true
          return s
        } else if (c === '/') {  //  '/' match tag field
          s.tag = true           //    (also register as char)
          s.regex = (s.regex || '') + '/?'
          return s
        }
      }
      s.regex = (s.regex || '') + (charClass[c] || escape(c))
      s.plain = (s.plain || '') + c
      s.wordEnd   = !!charClass[c] || wordCharRe.test(c)
      s.wordBeg ??= s.wordEnd
      return s
    },
  }
  let state = {} // contains: 'plain', 'regex', 'field', 'not', 'tag', 'quote'
  for (let c of queryStr.normalize()) {  // process char-by-char in FSA
    state = fsa[state.quote ? 'QUOTED' : fsa[c] ? c : 'UNQUOTED'](state, c) || {}
  }
  return query.addTerm(() => finalizeTerm(state)).get()
}

/*****************************************************************************/

function boldifyKlingon(txt) {
  return txt.replace(                          // boldify klingon
    /\{(.*?)\}/gs,
    (_, txt) => `<b lang=tlh>${txt.replace(/'/g, '’')}</b>`)
}

function expandMarkup(txt, hiliteRegex) {
  //return hilite(quotecurl(boldifyKlingon(txt)), hiliteRegex)
  return hilite(quotecurl(boldifyKlingon(txt)), hiliteRegex)
    .replace(/~(.*?)~/gs, '<i>$1</i>')         // our own italics
    .replace(/\n\n/g, '<p>')
}

function hilite(str, regex) {
  return str.replace(regex, (wholeMatch, ...parts) => {
    parts = parts.slice(0, -2).filter(p => p !== undefined) // FIXME simplify this?
    // Lookbehind (?<=...) not supported in Safari (and was only added to Edge
    // and Firefox in summer 2020), therefore use regex subgroups instead.
    const [pre, post] = (parts.length === 2) ? parts : ['', wholeMatch]
    return `${pre}<mark>${post}</mark>`
  })
}

function searchDict(queryStr, dict) {
  if (queryStr === '') { return }
  const query       = parseQuery(queryStr)
  const matches     = query.search(dict)
  const hiliteRegex = query.hilite()
  const num = Object.keys(matches).length
  return `<table class="noborder layout results">\n`
    + `<tr><td colspan=2>${num} ${num === 1 ? 'match' : 'matches'}.\n`
    + matches.map(
      entry => '<tr title=""><td colspan=2> \n'
        + Object.entries(entry).map(
          ([fieldName, fieldValue]) =>
          `<tr title=""><th class="right light">${fieldName}:</span>` +
            `<td>${expandMarkup(fieldValue, hiliteRegex)}\n`
        ).join('')
    ).join('')
    + `</table>`
}

// Fetch dict from server if it has changed, otherwise cache.
function cacheFetch(href) {
  const etag = localStorage.getItem('etag')
  return fetch(href, { headers: {
    'If-None-Match': (etag ? etag : {}),
  }}).then(reply => {
    if (reply.status === 304) {                // unmodified, use cache
      return Promise.resolve(localStorage.getItem('dict'))
    }
    if (reply.ok) {                            // changed, save to cache
      return reply.text().then(text => {
        const etag = reply.headers.get('ETag')
        if (etag && text) {
          localStorage.setItem('etag', etag)
          localStorage.setItem('dict', text)
        }
        return text
      })
    }
    const { status, statusText } = reply
    throw `ERROR: Can't fetch '${href}': Status ${status}: ${statusText}`
  })
}

/** Main **/

const outTag = document.querySelector('#output')
const formTag = document.querySelector('form')
const title = document.title
let   dict = []
handleForm(formTag, formState => {
  if (dict.length) {
    const queryStr = formState.get('q')
    document.title = `⟨${queryStr}⟩ – ${title}`
    outTag.innerHTML = searchDict(queryStr, dict)
  }
})

cacheFetch('dict.zdb').then((txt) => {
  dict = parseDict(txt)
  document.querySelector('.loading').remove()
  formTag.requestSubmit()
})

//[eof]
