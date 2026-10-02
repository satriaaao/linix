const fs = require('fs');
const path = require('path');
module.exports = function handler(req, res) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  res.statusCode = 404;
  res.end(fs.readFileSync(path.join(process.cwd(), '404.html'), 'utf8'));
};
