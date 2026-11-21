#!/usr/bin/env python3
"""공식 기관 RSS(Fed·SEC·DART) → news.json (링크만, 요약·해석 없음). 표준 라이브러리만 사용."""
import json, os, re, sys, time, urllib.error, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime

OUT = os.environ.get('NEWS_OUT', 'news.json')
FX = os.environ.get('NEWS_FIXTURE_DIR')  # 오프라인 시험용
UA = 'levergachi-news/1.0 (+https://levergachi.github.io)'
FEEDS = {
    'fed':  'https://www.federalreserve.gov/feeds/press_all.xml',
    'sec':  'https://www.sec.gov/news/pressreleases.rss',
    'dart': 'https://dart.fss.or.kr/api/todayRSS.xml',
}
OKHOST = {'fed': 'www.federalreserve.gov', 'sec': 'www.sec.gov', 'dart': 'dart.fss.or.kr'}
KEEP_DAYS = {'fed': 60, 'sec': 60, 'dart': 14, 'stk': 4, 'usj': 3, 'krj': 3, 'krn': 4, 'rd': 2, 'st': 2}
CAP = {'fed': 40, 'sec': 40, 'dart': 80, 'stk': 60, 'usj': 40, 'krj': 40, 'krn': 40, 'rd': 30, 'st': 30}
WATCH = ['삼성전자', 'SK하이닉스']
KW = re.compile(r'영업\(잠정\)실적|영업실적|유상증자|무상증자|자기주식|합병|분할|배당|단일판매|공급계약|감자|상장폐지|거래정지|횡령|배임|불성실|투자판단관련')

def get(src):
    if FX:
        with open(os.path.join(FX, src + '.xml'), 'rb') as f: return f.read()
    req = urllib.request.Request(FEEDS[src], headers={'User-Agent': UA, 'Accept': 'application/rss+xml, application/xml, text/xml'})
    with urllib.request.urlopen(req, timeout=25) as r: return r.read()

def parse(raw):
    raw = raw.lstrip(b'\xef\xbb\xbf').lstrip()
    root = ET.fromstring(raw)
    for it in root.iter('item'):
        yield (it.findtext('title') or '').strip(), (it.findtext('link') or '').strip(), (it.findtext('pubDate') or '').strip()

def iso(s):
    try:
        d = parsedate_to_datetime(s)
        if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    except Exception:
        return None

def translate_ko(text):
    """영어 제목 → 한국어 자동번역(구글 번역 비공식 엔드포인트). 실패하면 None."""
    if os.environ.get('NEWS_FAKE_KO'): return '[번역]' + text
    if not os.environ.get('NEWS_TRANSLATE'): return None  # GitHub 서버에서는 구글 번역이 429로 막혀 기본 꺼 둠(번역은 브라우저에서)
    try:
        url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ko&dt=t&q=' + urllib.parse.quote(text)
        with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=15) as r:
            j = json.loads(r.read())
        ko = ''.join(seg[0] for seg in j[0] if seg and seg[0]).strip()
        return ko if ko and ko != text and len(ko) < 400 else None
    except Exception as e:
        print('TRANSLATE FAIL', type(e).__name__, str(e)[:80], file=sys.stderr)
        return None

STK_KW = re.compile(r'earnings|EPS|revenue|guidance|outlook|forecast|upgrade|downgrade|price target|raises|cuts|slash|plunge|surge|soar|tumble|jump|sink|crash|rally|FDA|approv|acqui|merger|buyback|repurchase|offering|lawsuit|sues|probe|investigat|recall|tariff|export|ban\b|layoff|CEO|CFO|resign|dividend|split|contract|deal|partnership|beats|misses|bankrupt|short seller|delist|halt|chip|AI\b', re.I)
STK_NOISE = re.compile(r'should you|stocks? to buy|best stocks|top stocks|\d+ stocks|here.s why|buy now|zacks|motley|is it too late|better buy|vs\.|which is|worth buying|millionaire|forever|prediction|could (make|turn)', re.I)
STK_CAP_PER = 3
STK_KEEP_DAYS = 4

def bot_tickers():
    """data.json(저점매수신호봇 산출)에서 신호·근접·핫 종목. 한국 종목(.KS)은 DART가 다루므로 제외."""
    try:
        with open(os.environ.get('DATA_JSON', 'data.json'), encoding='utf-8') as f: d = json.load(f)
    except Exception as e:
        print('NO data.json', e, file=sys.stderr); return {}
    out = {}
    for k in ('signals', 'near', 'hot'):
        for x in d.get(k) or []:
            t = x.get('t') if isinstance(x, dict) else None
            if t and re.fullmatch(r'[A-Z][A-Z0-9.\-]{0,9}', t) and not t.endswith('.KS') and t not in out:
                out[t] = x.get('n') or t
    return out

def get_stk(tk):
    if FX:
        p = os.path.join(FX, 'stk_' + tk + '.xml')
        if not os.path.exists(p): return b'<rss><channel></channel></rss>'
        with open(p, 'rb') as f: return f.read()
    url = 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=' + urllib.parse.quote(tk) + '&region=US&lang=en-US'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; levergachi-news/1.0; +https://levergachi.github.io)', 'Accept': 'application/rss+xml, application/xml, text/xml'})
    with urllib.request.urlopen(req, timeout=20) as r: return r.read()

# 제목+링크만 모으는 일반 언론/커뮤니티 피드 (src, 이름, URL, 허용 호스트 정규식, 피드당 최대건수)
EXTRA = [
    ('usj', 'CNBC', 'https://www.cnbc.com/id/10000664/device/rss/rss.html', r'(^|\.)cnbc\.com$', 8),
    ('usj', 'CNBC 시장', 'https://www.cnbc.com/id/20910258/device/rss/rss.html', r'(^|\.)cnbc\.com$', 8),
    ('usj', 'MarketWatch', 'https://feeds.content.dowjones.io/public/rss/mw_topstories', r'(^|\.)marketwatch\.com$', 8),
    ('usj', 'Yahoo Finance', 'https://news.google.com/rss/search?q=when:1d+site:finance.yahoo.com&hl=en-US&gl=US&ceid=US:en', r'^news\.google\.com$', 6),
    ('usj', 'WSJ·Bloomberg·Reuters', 'https://news.google.com/rss/search?q=when:1d+(site:wsj.com+OR+site:bloomberg.com+OR+site:reuters.com)+stocks&hl=en-US&gl=US&ceid=US:en', r'^news\.google\.com$', 10),
    ('rd', 'r/wallstreetbets', 'https://www.reddit.com/r/wallstreetbets/top.rss?t=day', r'(^|\.)reddit\.com$', 8),
    ('rd', 'r/stocks', 'https://www.reddit.com/r/stocks/top.rss?t=day', r'(^|\.)reddit\.com$', 8),
    ('rd', 'r/investing', 'https://www.reddit.com/r/investing/top.rss?t=day', r'(^|\.)reddit\.com$', 6),
    ('krj', '한국경제', 'https://www.hankyung.com/feed/finance', r'(^|\.)hankyung\.com$', 8),
    ('krj', '매일경제', 'https://www.mk.co.kr/rss/50200011/', r'(^|\.)mk\.co\.kr$', 8),
    ('krj', '연합뉴스', 'https://www.yna.co.kr/rss/economy.xml', r'(^|\.)yna\.co\.kr$', 8),
    ('krj', '주요 경제지', 'https://news.google.com/rss/search?q=when:1d+(증시+OR+코스피+OR+반도체)&hl=ko&gl=KR&ceid=KR:ko', r'^news\.google\.com$', 12),
]
UA_B = 'Mozilla/5.0 (compatible; levergachi-news/1.0; +https://levergachi.github.io)'

def parse_any(raw):
    """RSS(item) 와 Atom(entry) 모두 (제목, 링크, 날짜, 출처) 로."""
    raw = raw.lstrip(b'\xef\xbb\xbf').lstrip()
    root = ET.fromstring(raw)
    for it in root.iter('item'):
        yield (it.findtext('title') or '').strip(), (it.findtext('link') or '').strip(), (it.findtext('pubDate') or '').strip(), (it.findtext('source') or '').strip()
    A = '{http://www.w3.org/2005/Atom}'
    for it in root.iter(A + 'entry'):
        l = it.find(A + 'link'); href = l.get('href') if l is not None else ''
        yield (it.findtext(A + 'title') or '').strip(), (href or '').strip(), (it.findtext(A + 'updated') or '').strip(), ''

def get_url(url, fxname):
    if FX:
        p = os.path.join(FX, fxname + '.xml')
        if not os.path.exists(p): raise IOError('no fixture ' + fxname)
        with open(p, 'rb') as f: return f.read()
    url = urllib.parse.quote(url, safe=":/?&=+()%@,.-_~")
    req = urllib.request.Request(url, headers={'User-Agent': UA_B, 'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml'})
    for k in range(2):
        try:
            with urllib.request.urlopen(req, timeout=20) as r: return r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and k == 0 and 'reddit.com' in url: time.sleep(6); continue
            raise

def iso_any(s):
    t = iso(s)
    if t: return t
    try:
        d = datetime.fromisoformat(s.replace('Z', '+00:00'))
        if d.tzinfo is None: d = d.replace(tzinfo=timezone.utc)
        return d.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    except Exception:
        return None

def kr_names():
    """봇의 한국 종목(.KS) → 구글뉴스 검색어(회사명)."""
    try:
        with open(os.environ.get('DATA_JSON', 'data.json'), encoding='utf-8') as f: d = json.load(f)
    except Exception: return {}
    out = {}
    for k in ('signals', 'near', 'hot'):
        for x in d.get(k) or []:
            if isinstance(x, dict) and str(x.get('t', '')).endswith('.KS'):
                nm = re.sub(r'\(.*?\)', '', x.get('n') or '').strip()
                if nm: out[x['t']] = nm
    return out

BAD = re.compile(r'fuck|shit|bitch|retard|nigg|faggot|stupid|idiot|scam|pump|dump|rug|moon\b|puts? on|calls? on|[\U0001F300-\U0001FAFF]{3,}', re.I)

def stocktwits(tk):
    """종목 커뮤니티: 최근 글 중 좋아요 많은 순 상위 1건(품질·욕설 거름)."""
    if FX:
        p = os.path.join(FX, 'st_' + tk + '.json')
        if not os.path.exists(p): return []
        raw = open(p, 'rb').read()
    else:
        req = urllib.request.Request('https://api.stocktwits.com/api/2/streams/symbol/' + urllib.parse.quote(tk) + '.json', headers={'User-Agent': UA_B, 'Accept': 'application/json'})
        with urllib.request.urlopen(req, timeout=20) as r: raw = r.read()
    out = []
    for m in json.loads(raw).get('messages', []):
        body = clean(m.get('body') or ''); user = (m.get('user') or {}).get('username') or ''
        likes = ((m.get('likes') or {}).get('total')) or 0
        t = iso_any(m.get('created_at') or '')
        if not (body and user and t and m.get('id')): continue
        if likes < 2 or not (25 <= len(body) <= 280) or BAD.search(body) or body.count('$') > 4 or 'http' in body: continue
        if not re.fullmatch(r'[A-Za-z0-9_.-]+', user): continue
        out.append((likes, body, 'https://stocktwits.com/' + user + '/message/' + str(m['id']), t, user))
    out.sort(key=lambda x: -x[0])
    return out[:1]

def clean(s): return re.sub(r'\s+', ' ', s).strip()

def dart_item(title):
    m = re.match(r'^\((유가|코스닥|코넥스|기타)\)\s*(.+?)\s+-\s+(.+)$', title)
    if not m: return None
    mk, co, subj = m.groups()
    if mk == '기타' or mk == '코넥스': return None
    watch = any(w in co for w in WATCH)
    if not (watch or KW.search(subj)): return None
    return {'co': co, 'mk': mk, 'watch': watch, 'subj': subj}

def main():
    old = {}
    try:
        with open(OUT, encoding='utf-8') as f: old = json.load(f)
    except Exception: pass
    items = {i['l']: i for i in old.get('items', []) if isinstance(i, dict) and i.get('l')}
    ok = {}
    for src in FEEDS:
        try:
            got = 0
            for title, link, pub in parse(get(src)):
                t = iso(pub); title = clean(title)
                if not (title and link and t): continue
                if not link.startswith('https://' + OKHOST[src] + '/'): continue
                rec = {'s': src, 't': title, 'l': link, 'd': t}
                if src == 'dart':
                    x = dart_item(title)
                    if not x: continue
                    rec.update({'t': x['subj'], 'co': x['co'], 'mk': x['mk']})
                    if x['watch']: rec['w'] = 1
                prev = items.get(link)
                if prev and prev.get('k') and prev.get('t') == rec['t']: rec['k'] = prev['k']
                items[link] = rec; got += 1
            ok[src] = got > 0
        except Exception as e:
            ok[src] = False
            print('FAIL', src, type(e).__name__, str(e)[:120], file=sys.stderr)
    def add_feed(src, label, url, fxname, hostre, cap, tk=None, co=None, need=None):
        got = 0
        for title, link, pub, srcname in parse_any(get_url(url, fxname)):
            t = iso_any(pub); title = clean(title)
            if not (title and link and t): continue
            m = re.match(r'^https://([^/]+)/', link)
            if not (m and re.search(hostre, m.group(1))): continue
            if need and not re.search(need, link): continue
            if got >= cap: break
            media = srcname or label
            if src in ('usj', 'krj', 'krn') and ' - ' in title and not srcname:
                title, media = title.rsplit(' - ', 1)
            elif ' - ' in title and srcname and title.endswith(' - ' + srcname): title = title[:-len(srcname) - 3]
            rec = {'s': src, 't': title, 'l': link, 'd': t, 'pub': media[:30]}
            if tk: rec['tk'] = tk; rec['co'] = co
            prev = items.get(link)
            if prev and prev.get('k') and prev.get('t') == title: rec['k'] = prev['k']
            items[link] = rec; got += 1
        return got
    for idx, (src, label, url, hostre, cap) in enumerate(EXTRA):
        try:
            n = add_feed(src, label, url, 'ex%d' % idx, hostre, cap); ok[src] = ok.get(src, False) or n > 0
            print('feed', label, n)
        except Exception as e:
            ok.setdefault(src, False); print('FAIL feed', label, type(e).__name__, str(e)[:80], file=sys.stderr)
        time.sleep(0.4)
    for tk, nm in kr_names().items():
        try:
            q = urllib.parse.quote(nm + ' when:2d')
            n = add_feed('krn', nm, 'https://news.google.com/rss/search?q=' + q + '&hl=ko&gl=KR&ceid=KR:ko', 'krn_' + tk, r'^news\.google\.com$', 4, tk=tk, co=nm)
            ok['krn'] = ok.get('krn', False) or n > 0; print('krn', nm, n)
        except Exception as e:
            ok.setdefault('krn', False); print('FAIL krn', nm, type(e).__name__, str(e)[:80], file=sys.stderr)
        time.sleep(0.4)
    tks = bot_tickers(); sgot = 0; sfail = 0
    for tk, nm in tks.items():
        try:
            n = add_feed('stk', 'Seeking Alpha', 'https://seekingalpha.com/api/sa/combined/' + urllib.parse.quote(tk) + '.xml', 'sa_' + tk, r'(^|\.)seekingalpha\.com$', 2, tk=tk, co=nm, need=r'/(article|news)/')
            ok['sa'] = ok.get('sa', False) or n > 0
        except Exception as e:
            ok.setdefault('sa', False); print('FAIL sa', tk, type(e).__name__, str(e)[:60], file=sys.stderr)
        try:
            for likes, body, link, t, user in stocktwits(tk):
                items[link] = {'s': 'st', 't': body, 'l': link, 'd': t, 'tk': tk, 'co': nm, 'pub': 'StockTwits @' + user + ' ♥' + str(likes)}
            ok['st'] = True
        except Exception as e:
            ok.setdefault('st', False); print('FAIL st', tk, type(e).__name__, str(e)[:60], file=sys.stderr)
        time.sleep(0.5)
    for tk, nm in tks.items():
        try:
            n = 0
            for title, link, pub in parse(get_stk(tk)):
                t = iso(pub); title = clean(title)
                if not (title and link and t): continue
                if not re.match(r'^https://([a-z0-9-]+\.)?yahoo\.com/', link): continue
                if not STK_KW.search(title) or STK_NOISE.search(title): continue
                if n >= STK_CAP_PER: break
                rec = {'s': 'stk', 't': title, 'l': link, 'd': t, 'tk': tk, 'co': nm}
                prev = items.get(link)
                if prev and prev.get('k') and prev.get('t') == title: rec['k'] = prev['k']
                items[link] = rec; n += 1; sgot += 1
            time.sleep(0.4)
        except Exception as e:
            sfail += 1; print('FAIL stk', tk, type(e).__name__, str(e)[:80], file=sys.stderr)
    if tks: ok['stk'] = sgot > 0 or sfail < len(tks)
    now = datetime.now(timezone.utc)
    out = []
    for src in list(FEEDS) + ['stk', 'usj', 'krj', 'krn', 'rd', 'st']:
        lst = [i for i in items.values() if i['s'] == src]
        lst = [i for i in lst if (now - datetime.strptime(i['d'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)).days <= KEEP_DAYS[src]]
        if src == 'krn': lst = [i for i in lst if i.get('tk') in kr_names()] if kr_names() else lst
        if src in ('stk', 'st') and tks: lst = [i for i in lst if i.get('tk') in tks]
        lst.sort(key=lambda i: i['d'], reverse=True)
        out += lst[:CAP[src]]
    out.sort(key=lambda i: i['d'], reverse=True)
    fails = 0
    for i in out:
        if i['s'] in ('fed', 'sec') and not i.get('k'):
            if fails >= 3: break
            ko = translate_ko(i['t'])
            if ko: i['k'] = ko; time.sleep(0.3)
            else: fails += 1
    same = [i for i in old.get('items', [])] == out
    fresh = False
    try:
        fresh = (now - datetime.strptime(old['updated'], '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)).total_seconds() < 6 * 3600
    except Exception: pass
    if same and fresh and old.get('ok') == ok:
        print('no change'); return
    res = {'v': 1, 'updated': now.strftime('%Y-%m-%dT%H:%M:%SZ'), 'ok': ok, 'n': len(out), 'items': out}
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(res, f, ensure_ascii=False, separators=(',', ':'))
    print('wrote', len(out), ok)
    if not any(ok.values()): sys.exit(1)

main()
