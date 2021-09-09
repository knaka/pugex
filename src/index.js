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
  preserve_newlines: false,
  max_preserve_newlines: 0,
  wrap_line_length: 0,
  wrap_attributes_indent_size: 0,
  unformatted: ['b', 'em']
};

(async () => {
  const inFile = process.argv[2]
  const outFile = path.join(path.dirname(inFile), path.basename(inFile, path.extname(inFile)) + ".html")
  const htmlInput = pug.renderFile(inFile)
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
  fs.writeFileSync(outFile, html)
})();

function psvPlugin() {
  return (tree) => {
    tree.match({tag: 'div', attrs: {"class": "psvtable"}}, (node) => {
      let tabhead = []
      let tabbody = []
      node.content[0].split("\n").forEach((line) => {
        if (line.trim() === "") {
          return
        }
        const elems = line.split("|");
        (tabhead.length == 0? tabhead: tabbody).push({
          tag: "tr",
          content: elems.map((elem) => {
            return {tag: "td", content: elem.trim()}
          })
        })
      })
      return {
        tag: 'table',
        attrs: node.attrs,
        content: [
          {
            tag: 'thead',
            content: tabhead
          },
          {
            tag: "tbody",
            content: tabbody
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
    tree.match({tag: 'div', attrs: { "class": "sass"}}, filter);
    return tree;
  };
}
