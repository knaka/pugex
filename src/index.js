#!/usr/bin/env node
"use strict";

const pug = require('pug');
const posthtml = require("posthtml");
const sass = require("sass");
// const beautify = require('posthtml-beautify')
const beautify = require('js-beautify');
const fs = require('fs');
const path = require("path");

const beautifyOptions = {
  indent_size: 2,
  end_with_newline: true,
  preserve_newlines: true,
  max_preserve_newlines: 0,
  wrap_line_length: 0,
  wrap_attributes_indent_size: 0,
  unformatted: ['b', 'em']
};

(async () => {
  const inFile = process.argv[2]
  const outFile = path.join(path.dirname(inFile), path.basename(inFile, path.extname(inFile)) + ".html")
  const htmlInput = pug.renderFile(inFile, {
    "require": require,
  })
  const result = await posthtml([
    sassPlugin(),
    psvPlugin(),

/*    beautify({rules: {
      indent: 2,
      blankLines: false,
    }}) */
  ])
    .process(htmlInput.toString());
  const html = beautify.html(result.html, beautifyOptions)
  // const html = result.html
  fs.writeFileSync(outFile, html)
})();

function psvPlugin() {
  return (tree) => {
    tree.match({tag: 'div', attrs: {"class": /\bpsvtable\b/}}, (node) => {
      let cell = []
      let row = []
      let table = []
      let tag = "th"
      if (node.content.length > 0 && typeof(node.content[node.content.length-1]) == "string") {
        const s = node.content[node.content.length-1]
        if (s.length > 0 && s[s.length-1] != "\n") {
          node.content[node.content.length-1] += "\n"
        }
      }
      node.content.forEach((elem) => {
        if (typeof(elem) === "object") {
          cell.push(elem)
          return
        }
        while (elem.length > 0) {
          const i = elem.search(/[|\n]/)
          if (i === -1) {
            if (elem.trim().length > 0) {
              cell.push(elem)
            }
            break
          }
          const delim = elem[i]
          const str = elem.slice(0, i)
          elem = elem.slice(i + 1)
          if (cell.length > 0) {
            if (str.trim().length > 0) {
              cell.push(str)
            }
            row.push({
              tag: tag,
              content: cell
            })
          } else {
            row.push({
              tag: tag,
              content: str
            })
          }
          cell = []
          if (delim === "\n") {
            table.push({
              tag: "tr",
              content: row
            })
            row = []
            tag = "td"
          }
        }
      })
      if (cell.length > 0) {
        row.push({
          tag: tag,
          content: cell
        })
      }
      if (row.length > 0) {
        table.push({
          tag: "tr",
          content: row
        })
      }
      return {
        tag: 'table',
        attrs: node.attrs,
        content: [
          {
            tag: 'thead',
            content: table.slice(0, 1)
          },
          {
            tag: "tbody",
            content: table.slice(1)
          }
        ]
      };
    });
    return tree;
  };
}

function sassPlugin() {
  const filter = (node) => {
    const result = sass.renderSync({data: node.content[0]});
    const css = result.css.toString();
    return {
      tag: 'style',
      attrs: { "type": "text/css" },
      content: css
    };
  }
  return (tree) => {
    tree.match({tag: 'style', attrs: { "type": "text/sass"}}, filter);
    tree.match({tag: 'style', attrs: { "type": "text/scss"}}, filter);
    tree.match({tag: 'div', attrs: { "class": /\bsass\b/}}, filter);
    tree.match({tag: 'div', attrs: { "class": /\bscss\b/}}, filter);
    return tree;
  };
}
