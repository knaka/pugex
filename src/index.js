#!/usr/bin/env node
"use strict";
const posthtml = require("posthtml");
const sass = require("sass");
const html = `
<html lang="en">
  <style type="text/sass">
    table#foo {
      td, th {
        text-align: right;
      }
    }
  </style>
</html>
`;
(async () => {
    const result = await posthtml([x({})])
        .process(html);
    console.log("d:" + result.html);
})();
function x(options) {
    return (tree) => {
        tree.match({ tag: 'style', attrs: { "type": "text/sass" } }, (node) => {
            const result = sass.renderSync({ data: node.content[0] });
            const css = result.css.toString();
            return {
                tag: 'style',
                attrs: { "type": "text/css" },
                content: css
            };
        });
        return tree;
    };
}
//# sourceMappingURL=index.js.map