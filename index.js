const https = require('https');
const fs = require("fs");
const path = require("path");
const HTMLParser = require('node-html-parser');

const directory = "./example";
const input = "index.html";
const output = "index-compiled.html";

const root = HTMLParser.parse(fs.readFileSync(path.join(directory, input)));
const stuff = root.querySelectorAll("link[href$=css], script[src$=js]");
const promises = stuff.map((node) => {
  const { rawTagName } = node;
  return rawTagName === "script" ? processScript(node) : processStyle(node)
});

Promise.all(promises).then(() => {
  fs.writeFileSync(path.join(directory, output), root.toString())
}).catch(console.error);

function processScript(node) {
  return new Promise((resolve, reject) => {
    const src = node.getAttribute("src");
    get(src).then((contents) => {
      node.replaceWith(`<script compiled-src="${src}">\n${contents}\n</script>`);
      resolve();
    }).catch(reject)
  });
}

function processStyle(node) {
  return new Promise((resolve, reject) => {
    const href = node.getAttribute("href");
    get(href).then((contents) => {
      node.replaceWith(`<style compiled-href="${href}">\n${contents}\n</style>`);
      resolve();
    }).catch(reject)
  });
}

function get(url) {
  return new Promise((resolve, reject) => {
    if (url.match(/^http/)) {
      https.get(url, (response) => {
        let data = '';
        response.on('data', (chunk) => data += chunk);
        response.on('end', () => resolve(data));
      }).on("error", (err) => reject(err.message));
    } else {
      resolve(fs.readFileSync(path.join(directory, url)).toString());
    }
  })
}