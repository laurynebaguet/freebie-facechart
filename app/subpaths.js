// Découpe un attribut "d" SVG en sous-chemins indépendants, chacun réécrit
// avec un "M" absolu en tête pour rester positionné correctement.
(function (root) {
  var ARITY = { M:2, L:2, T:2, H:1, V:1, C:6, S:4, Q:4, A:7, Z:0 };

  function tokenize(d) {
    var re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g;
    var out = [], m;
    while ((m = re.exec(d))) out.push(m[1] ? m[1] : parseFloat(m[2]));
    return out;
  }

  function parse(d) {
    var t = tokenize(d), i = 0, cmds = [], cur = null;
    while (i < t.length) {
      if (typeof t[i] === 'string') { cur = t[i]; i++; }
      else if (cur === 'M') cur = 'L';
      else if (cur === 'm') cur = 'l';
      var n = ARITY[cur.toUpperCase()];
      var args = t.slice(i, i + n);
      i += n;
      cmds.push({ cmd: cur, args: args });
      if (n === 0) cur = null;
    }
    return cmds;
  }

  function fmt(c) { return c.cmd + (c.args.length ? ' ' + c.args.join(' ') : ''); }

  function split(d) {
    var cmds = parse(d), subs = [], x = 0, y = 0, sx = 0, sy = 0, cur = null;
    for (var i = 0; i < cmds.length; i++) {
      var c = cmds[i], a = c.args, u = c.cmd.toUpperCase(), rel = c.cmd !== u;
      if (u === 'M') {
        x = rel ? x + a[0] : a[0];
        y = rel ? y + a[1] : a[1];
        sx = x; sy = y;
        cur = { start: [x, y], parts: [] };
        subs.push(cur);
        continue;                       // le M absolu est réémis à la fin
      }
      if (cur) cur.parts.push(fmt(c));
      switch (u) {
        case 'Z': x = sx; y = sy; break;
        case 'H': x = rel ? x + a[0] : a[0]; break;
        case 'V': y = rel ? y + a[0] : a[0]; break;
        default:
          var n = a.length;
          x = rel ? x + a[n - 2] : a[n - 2];
          y = rel ? y + a[n - 1] : a[n - 1];
      }
    }
    return subs.map(function (s) {
      return 'M ' + s.start[0] + ',' + s.start[1] + ' ' + s.parts.join(' ');
    });
  }

  root.SubPaths = { split: split, parse: parse };
})(window);
