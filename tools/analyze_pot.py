import os, re, json, sys

root = os.getcwd()
folder = os.path.join(root, 'localization','pt_BR','interface','text','mission','single','041-usa_airborne')
if not os.path.isdir(folder):
    print(json.dumps({'error':'folder not found', 'folder': folder}))
    sys.exit(1)

ph_pattern = re.compile(r'%\d+%|%[sd]|%\d+\$s')
english_indicators = re.compile(r'\b(the|and|of|to|in|for|with|you|we|they|our|your)\b', re.I)

results = {}
total_entries = 0
for fname in sorted(os.listdir(folder)):
    if not fname.endswith('.pot'):
        continue
    path = os.path.join(folder, fname)
    try:
        with open(path, 'r', encoding='utf-8') as fh:
            lines = fh.read().splitlines()
    except Exception as ex:
        results[fname] = {'error': str(ex)}
        continue
    file_issues = []
    # fuzzy header
    if any(l.strip().startswith('#, fuzzy') for l in lines[:5]):
        file_issues.append({'type':'fuzzy_header', 'msg': 'File has fuzzy header'})
    # parse entries
    L = len(lines)
    i = 0
    def parse_quoted(lines, idx):
        s = lines[idx].rstrip('\n')
        qpos = s.find('"')
        if qpos == -1:
            return '', idx+1
        lastq = s.rfind('"')
        part = s[qpos+1:lastq] if lastq>qpos else ''
        j = idx+1
        while j < len(lines) and lines[j].lstrip().startswith('"'):
            l = lines[j].strip()
            if l.startswith('"') and l.endswith('"'):
                part += l[1:-1]
            else:
                part += l.strip('"')
            j += 1
        return part, j

    entries = []
    while i < L:
        line = lines[i].lstrip()
        if line.startswith('msgctxt'):
            ctx, i = parse_quoted(lines, i)
            mid = ''
            mst = ''
            if i < L and lines[i].lstrip().startswith('msgid'):
                mid, i = parse_quoted(lines, i)
            if i < L and lines[i].lstrip().startswith('msgstr'):
                mst, i = parse_quoted(lines, i)
            entries.append((ctx, mid, mst))
            continue
        if line.startswith('msgid'):
            ctx = None
            mid, i = parse_quoted(lines, i)
            mst = ''
            if i < L and lines[i].lstrip().startswith('msgstr'):
                mst, i = parse_quoted(lines, i)
            entries.append((ctx, mid, mst))
            continue
        i += 1

    for ctx, mid, mst in entries:
        if mid is None:
            continue
        mid_s = (mid or '').strip()
        mst_s = (mst or '').strip()
        if mid_s == '':
            continue
        total_entries += 1
        if mst_s == '':
            file_issues.append({'type':'untranslated','ctx':ctx,'msgid':mid_s,'msgstr':mst_s})
            continue
        if mst_s == mid_s:
            file_issues.append({'type':'same-as-english','ctx':ctx,'msgid':mid_s,'msgstr':mst_s})
        # placeholders
        mid_ph = ph_pattern.findall(mid_s)
        mst_ph = ph_pattern.findall(mst_s)
        if mid_ph and (len(mid_ph) != len(mst_ph) or set(mid_ph) != set(mst_ph)):
            file_issues.append({'type':'placeholder-mismatch','ctx':ctx,'msgid':mid_s,'msgstr':mst_s,'mid_ph':mid_ph,'mst_ph':mst_ph})
        # english indicator in msgstr
        if english_indicators.search(mst_s):
            # but ignore short technical names
            # flag only if multiple triggers
            if len(english_indicators.findall(mst_s))>=2:
                file_issues.append({'type':'contains-english-words','ctx':ctx,'msgid':mid_s,'msgstr':mst_s})
        # suspicious length ratio
        if len(mid_s)>0:
            ratio = len(mst_s)/len(mid_s)
            if ratio < 0.35 or ratio>3.0:
                file_issues.append({'type':'length-ratio','ctx':ctx,'msgid':mid_s,'msgstr':mst_s,'ratio':ratio})
    results[fname] = {'issues': file_issues, 'entries': len(entries)}

print(json.dumps({'files':results,'total_entries': total_entries}, ensure_ascii=False, indent=2))
