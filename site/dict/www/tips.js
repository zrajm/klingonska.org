/*-*- js-indent-level: 2 -*-*/
// Copyright 2012-2025 by zrajm. Licenses: CC BY-SA (text), GPLv2 (code).

// Display random search tip to user.
const tips = [
  'Hover over a field in search results to see field description.',
  'Use a search prefix (e.g. <a href="?q=tag:klcp1"><b>tag:klcp1</b></a>) '
    + 'to search only a given field (here: <b>tag:</b>).',
  'Use <a href="?q=def:holqed-10-4"><b>def:holqed-10-4</b></a> to find all words '
    + 'first occurring in <i><a href="../canon/2001-12-holqed-10-4.txt">'
    + '<b lang=tlh>HolQeD</b> issue 10:4</a>.</i>',
  'Prefixes: <b>tlh:</b> = Klingon, <b>en:</b> = English, <b>sv:</b> = '
    + 'Swedish, <b>pos:</b> = part-of-speech.',
  'Prefixes: <b>com:</b> = comment, <b>def:</b> = defining source, '
    + '<b>ref:</b> = referring source.',
  'Use <a href="?q=tlh:*chuq"><b>tlh:*chuq</b></a> to finds all Klingon '
    + 'words ending in <b>chuq.</b>',
  'Use <a href="?q=tag:klcp1"><b>tag:klcp1</b></a> to find all '
    + '<a href="../klcp.html#_6">first level words</a> from the<br>'
    + '<a href="../klcp.html"><i>Klingon Language Certification Program'
    + '</i></a>.',
  'Use <a href="?q=def:kgt"><b>def:kgt</b></a> to find all words first '
    + 'occurring in <i><a href="../canon/1997-11-01-kgt.txt">KGT</a>.</i>',
  'Put <b>tlh:</b> before a word to search only Klingon fields for it.',
  'Put <b>en:</b> before a word to search only English fields for it.',
  'Put <b>sv:</b> before a word to search only Swedish fields for it.',
  'Use <b>pos:v</b> to search for <i>verbs</i> (see <i>'
    + '<a href="intro.html#pos">Introduction</a></i> for other word '
    + 'types).</i>',
  'Use <a href="?q=pos:ns2"><b>pos:ns2</b></a> to find <i>noun suffixes '
    + 'type 2</i> (also try numbers <i>1&#8211;5</i>).',
  'Use <a href="?q=pos:vs1"><b>pos:vs1</b></a> to find <i>verb suffixes '
    + 'type 1</i> (also try letter <i>r,</i> and numbers <i>1&#8211;9</i>).',
  'Use <a href="?q=pos:vsr"><b>pos:vsr</b></a> or <a href="?q=pos:rover">'
    + '<b>pos:rover</b></a> to search for <i>verb suffix rovers.</i>',
  'Use <b>*</b> to mean any sequence of letters when searching.',
  'Use quotes (<b>"…"</b>) to search for several words after each other.',
  'With multiple search words, all are needed for a match (e.g. '
    + '<a href="?q=en:battle pos:v"><b>en:battle pos:v</b></a>).',
  'Search is case insensitive, except with <b>tlh:</b> prefix.',
]
document.querySelector('#tips').innerHTML
  = tips[Math.floor(Math.random() * tips.length)]

//[eof]
