#!/usr/bin/env python3
"""미국·국장 대형주 시세 → heat.json (히트맵용). 야후 차트 API(무료·지연), 표준 라이브러리만 사용."""
import json, os, sys, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone

OUT = os.environ.get('HEAT_OUT', 'heat.json')
FX = os.environ.get('HEAT_FIXTURE_DIR')
UA = 'Mozilla/5.0 (compatible; levergachi-heat/1.0; +https://levergachi.github.io)'

def ysym(k):
    if k.startswith('KS'): return k[2:] + '.KS'
    if k.startswith('KQ'): return k[2:] + '.KQ'
    return k.replace('.', '-')

def fetch(k):
    s = ysym(k)
    if FX:
        p = os.path.join(FX, s + '.json')
        if not os.path.exists(p): return None
        j = json.load(open(p))
    else:
        url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + s + '?range=5d&interval=1d'
        j = None
        for a in range(3):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=20) as r:
                    j = json.loads(r.read()); break
            except Exception:
                time.sleep(1.5 * (a + 1))
        if j is None: return None
    try:
        res = j['chart']['result'][0]; m = res['meta']
        p = m.get('regularMarketPrice')
        ts = res.get('timestamp') or []; cl = res['indicators']['quote'][0].get('close') or []
        off = m.get('gmtoffset') or 0; rt = m.get('regularMarketTime') or (ts[-1] if ts else 0)
        pairs = [(t, c) for t, c in zip(ts, cl) if c is not None]
        if not p or not pairs: return None
        today = (rt + off) // 86400
        # 오늘 봉이 이미 있으면 그 직전 종가가 전일 종가, 없으면 마지막 종가가 전일 종가
        prev = None
        for t, c in reversed(pairs):
            if (t + off) // 86400 < today: prev = c; break
        if prev is None: return None
        return [round(float(p), 4), round(float(prev), 4)]
    except Exception:
        return None

def main():
    lists = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'heat_lists.json'), encoding='utf-8'))
    try: old = json.load(open(OUT, encoding='utf-8'))
    except Exception: old = {}
    res = {}
    for mk in ('us', 'kr'):
        oldq = {r[0]: r for r in old.get(mk, [])}
        syms = [x[0] for x in lists[mk]]
        with ThreadPoolExecutor(max_workers=6) as ex: got = list(ex.map(fetch, syms))
        rows, n = [], 0
        for x, g in zip(lists[mk], got):
            if g: n += 1; rows.append([x[0], x[1], x[2], x[3], g[0], g[1]])
            elif x[0] in oldq: rows.append(oldq[x[0]])
        res[mk] = rows; res[mk + '_ok'] = n
        print(mk, n, '/', len(syms))
    if res['us_ok'] + res['kr_ok'] == 0:
        print('no data'); sys.exit(1)
    if old.get('us') == res['us'] and old.get('kr') == res['kr']:
        print('no change'); return
    out = {'v': 1, 'updated': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'ok': {'us': res['us_ok'], 'kr': res['kr_ok']}, 'us': res['us'], 'kr': res['kr']}
    json.dump(out, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('wrote', out['ok'])

main()
