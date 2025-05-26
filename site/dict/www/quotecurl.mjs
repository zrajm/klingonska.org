//-*- mode: js; js-indent-level: 2 -*-
// Copyright 2025 by zrajm. License: GPLv2.
// https://zrajm.org/quotecurl/

export function quotecurl(txt) {
  return quoty(txt).replace(/['"]|---|--|\.\.\./g, x =>
    ({'"': '”',  "'": '’',  '--': '–', '---': '—', '...': '…'}[x]))
}

const quotePairRegex = new RegExp(
  // Match a quote pair.
  /(?<!\w)(['"])([^\w\s]*(?:(?=\w).*?(?<=\w))?[^\w\s]*)\1(?!\w)/.source
  // Convert '\w' and '\s' into Unicode properties.
    .replace(/\\([ws])/g, (_, x) => ({
      w: '\\p{Letter}',
      s: '\\p{Space_Separator}',
    }[x])), 'gu')

// Call recursivelly until there are no more changes (for nested quotes).
function quoty(orgTxt) {
  const newTxt = orgTxt.replace(
    quotePairRegex,
    (_, q, txt) => q === "'" ? `‘${txt}’` : `“${txt}”`)
  return newTxt !== orgTxt ? quoty(newTxt) : newTxt // repeat until stop changing
}

//[eof]
