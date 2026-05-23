#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SERVER_PARTS = [
  'src/server/00-bootstrap.js',
  'src/server/10-country.js',
  'src/server/20-parser.js',
  'src/server/30-fetch-geo.js',
  'src/server/40-surge-policy.js',
  'src/server/50-landing-availability.js',
];
const ROUTER_PART = 'src/server/90-html-router.js';
const CLIENT_PART = 'src/client/app.js';
const OUT_FILE = 'subviz.js';

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/[ \t]+$/gm, '').replace(/\s*$/, '\n');
}

function parseMarker(bootstrap) {
  const marker = bootstrap.match(/var\s+MARKER\s*=\s*'([^']+)'\s*;/);
  if (!marker) throw new Error('Missing MARKER in src/server/00-bootstrap.js');
  if (!/^SUBVIZ_SURGE_[A-Z0-9_]+$/.test(marker[1])) throw new Error('Unsafe MARKER: ' + marker[1]);
  return marker[1];
}

function build() {
  const bootstrap = read(SERVER_PARTS[0]);
  const marker = parseMarker(bootstrap);
  let out = '';
  out += `var ${marker} = true;\n`;
  out += 'var SubViz = (function () {\n';
  out += "  'use strict';\n";
  out += SERVER_PARTS.map(read).join('\n');
  out += '\n';
  out += '  var CLIENT_JS = ' + JSON.stringify(read(CLIENT_PART)) + ';\n';
  out += read(ROUTER_PART);
  out += '})();\n';
  out += 'SubViz.main();\n';
  fs.writeFileSync(path.join(ROOT, OUT_FILE), out, 'utf8');
}

build();
