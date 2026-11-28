#!/usr/bin/env python3
"""oldterri updater: derive renamed obfuscated hooks and write them back.

Usage:
  python3 update.py                       # dry run, local/live game + diff
  python3 update.py --game-file NEW.js    # dry run against a local game script
  python3 update.py --apply               # write game/injectionA/build, rebuild
  python3 update.py --apply --skip-build

The derived hook map is the single source of truth; every path in hooks.json is
re-derived by token-context alignment against the new build. Renames that the
aligner cannot resolve abort the run (no partial writes).
"""
import argparse
import difflib
import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
TOOL = HERE / 'derive_hooks.py'


def fetch_game_script(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'oldterri-update/1.0'})
    html = urllib.request.urlopen(request, timeout=60).read().decode('utf-8', 'replace')
    start = html.find('<script>')
    end = html.find('</script>', start)
    if start < 0 or end < 0:
        raise RuntimeError('cannot find game script in HTML')
    script = html[start + len('<script>'):end]
    return script.replace('\r\n', '\n').replace('\r', '\n').replace('\n', '')


def parse_version(script):
    date_match = re.search(r'this\.eC="([^"]+)"', script)
    date = date_match.group(1).split('[')[0].strip() if date_match else None
    build_match = re.search(r'this\.o="([^"]+)"', script)
    build = build_match.group(1) if build_match else None
    return date, build


def derive(old_text, new_text, hooks_path, radius):
    old_path = HERE / 'game.old.js'
    new_path = HERE / 'game.new.js'
    out_path = HERE / 'hooks.resolved.json'
    old_path.write_text(old_text, encoding='utf-8')
    new_path.write_text(new_text, encoding='utf-8')
    command = [
        sys.executable, str(TOOL), '--old', str(old_path), '--new', str(new_path),
        '--hooks', str(hooks_path), '--out', str(out_path),
        '--radius', str(radius), '--min-votes', '1',
    ]
    print('+', ' '.join(command))
    completed = subprocess.run(command)
    if completed.returncode != 0:
        raise SystemExit('derive_hooks failed; unresolved hooks must be handled manually')
    return json.loads(out_path.read_text(encoding='utf-8'))


def replacement_paths(hooks, resolved):
    pairs = []
    for hook_id, spec in hooks['hooks'].items():
        report = resolved.get('report', {}).get(hook_id)
        if not report or not report.get('best'):
            continue
        old_path = spec['path']
        new_path = report['best']
        if old_path != new_path:
            pairs.append((old_path, new_path))
    pairs = sorted(set(pairs), key=lambda item: -len(item[0]))
    return pairs


def alias_map(text, hooks, resolved):
    """Find local aliases whose initializer references a hook's old parent path.

    injectionA.js uses both full paths (bB.iD.iK) and aliases (support.jQ,
    controller.a6M, __fxAd.fn). The full path rewrites handle the first form;
    this finds the alias variables needed for the second form.
    """
    aliases = {}
    for hook_id, spec in hooks['hooks'].items():
        component = spec.get('component', 0)
        if component < 1:
            continue
        old_path = spec['path']
        parts = old_path.split('.')
        if component != len(parts) - 1:
            continue
        report = resolved.get('report', {}).get(hook_id)
        if not report or not report.get('best'):
            continue
        new_parts = report['best'].split('.')
        if len(new_parts) != len(parts):
            continue
        old_component, new_component = parts[-1], new_parts[-1]
        if old_component == new_component:
            continue
        parent = '.'.join(parts[:-1])
        pattern = re.compile(
            r'\b(?:var|const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*[^;\n]*?'
            + re.escape(parent) + r'(?![.\w$])'
        )
        for alias in pattern.findall(text):
            aliases.setdefault(alias, []).append((old_component, new_component))
    return aliases


def apply_renames(text, pairs, aliases):
    for old_path, new_path in pairs:
        pattern = re.compile(r'(?<![\w$])' + re.escape(old_path) + r'(?![\w$])')
        text = pattern.sub(new_path, text)
    for alias, components in aliases.items():
        for old_component, new_component in components:
            pattern = re.compile(
                r'(?<![\w$])' + re.escape(alias) + r'\.' + re.escape(old_component) + r'(?![\w$])'
            )
            text = pattern.sub(alias + '.' + new_component, text)
    return text


# Anchors in build.js that are not plain hook paths: they reference local
# variable names / method names the aligner cannot resolve. If one of these
# moves in a new build, build.js will fail loudly -- report it up front.
MANUAL_ANCHORS = [
    'function dN(){var hq=0;var hr=0;',
    'appearance:"interaction-only"',
    'this.ei=function(){return bm.buffer.data[160].value;}',
    'this.dv=function(){if(m.e8||(!m.aA&&!m.eG)){',
    'this.dv=function(){a1.a2.eh();this.turnstile.dv();};',
    'var ej=1000*12;this.show=function(ek){',
    'if(!b1.z.er(0)){ej=bi.el+1000*1;return;}b1.es.et(5);};',
    'this.eu=function(ev){eo=ev;};',
    'bx.show(adK,ou,od,pow);',
    'this.show=function(ot,ou,od,pow){',
    'function ov(){op=document.activeElement;',
    'oe.style.setProperty("--tile",size+"px");};',
    'return ".captcha-overlay{position:fixed;inset:0;z-index:5;',
]


def check_manual_anchors(new_text):
    missing = [anchor for anchor in MANUAL_ANCHORS if anchor not in new_text]
    if missing:
        print('\nWARNING: %d manual anchors missing in new game (update build.js by hand):' % len(missing))
        for anchor in missing:
            print('  -', anchor)


def show_diff(label, before, after):
    diff = list(difflib.unified_diff(
        before.splitlines(), after.splitlines(),
        fromfile=label + ' (old)', tofile=label + ' (new)', lineterm=''
    ))
    if diff:
        print('\n'.join(diff[:160]))
        if len(diff) > 160:
            print('... (%d more diff lines)' % (len(diff) - 160))
    else:
        print('  (no changes)')


def update_hooks_file(path, hooks, resolved, date, build):
    changed = []
    for hook_id, spec in hooks['hooks'].items():
        report = resolved.get('report', {}).get(hook_id)
        if report and report.get('best') and spec['path'] != report['best']:
            changed.append((hook_id, spec['path'], report['best']))
            spec['path'] = report['best']
    hooks['version'] = date or hooks.get('version')
    hooks['build'] = build or hooks.get('build')
    path.write_text(json.dumps(hooks, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    return changed


def main():
    parser = argparse.ArgumentParser(description='Update oldterri to a new Territorial.io build.')
    parser.add_argument('--game-file', help='use a local game script instead of downloading')
    parser.add_argument('--hooks', default=str(HERE / 'hooks.json'))
    parser.add_argument('--radius', type=int, default=14)
    parser.add_argument('--apply', action='store_true', help='write files and rebuild')
    parser.add_argument('--skip-build', action='store_true')
    args = parser.parse_args()

    hooks_path = Path(args.hooks).resolve()
    hooks = json.loads(hooks_path.read_text(encoding='utf-8'))

    game_path = ROOT / hooks.get('game', 'game/latest.js')
    old_text = game_path.read_text(encoding='utf-8')
    if args.game_file:
        new_text = Path(args.game_file).read_text(encoding='utf-8').replace('\r\n', '\n').replace('\r', '\n').replace('\n', '')
    else:
        print('fetching https://territorial.io ...')
        new_text = fetch_game_script('https://territorial.io')
    old_date, old_build = parse_version(old_text)
    new_date, new_build = parse_version(new_text)
    print('game: %s %s -> %s %s' % (old_date, old_build, new_date, new_build))
    if old_text == new_text:
        print('game script unchanged; nothing to do')
        return

    resolved = derive(old_text, new_text, hooks_path, args.radius)
    pairs = replacement_paths(hooks, resolved)
    print('renamed paths (%d):' % len(pairs))
    for old_path, new_path in pairs:
        print('  %s -> %s' % (old_path, new_path))
    check_manual_anchors(new_text)

    targets = {
        'injectionA.js': ROOT / 'automation/full/injectionA.js',
        'build.js': ROOT / 'build.js',
    }
    originals = {name: path.read_text(encoding='utf-8') for name, path in targets.items()}
    aliases = alias_map(originals['injectionA.js'], hooks, resolved)
    if aliases:
        print('aliases to rewrite:', ', '.join('%s.(%s)' % (a, ','.join(c[0] for c in v)) for a, v in aliases.items()))

    updated = {}
    for name, text in originals.items():
        updated[name] = apply_renames(text, pairs, aliases)
        print('\n--- %s ---' % name)
        show_diff(name, text, updated[name])

    if not args.apply:
        print('\ndry run only. use --apply to write changes and rebuild.')
        return

    backup_name = 'game/latest_%s.js' % (old_date or old_build or 'previous')
    backup_path = ROOT / backup_name
    if not backup_path.exists():
        shutil.copy2(game_path, backup_path)
        print('backup:', backup_path)

    for name, path in targets.items():
        path.write_text(updated[name], encoding='utf-8')
        print('wrote', path)
    game_path.write_text(new_text, encoding='utf-8')
    print('wrote', game_path)
    changed = update_hooks_file(hooks_path, hooks, resolved, new_date, new_build)
    print('hooks.json paths updated:', len(changed))

    if not args.skip_build:
        print('+ node build.js')
        subprocess.run(['node', 'build.js'], cwd=str(ROOT), check=True)
        print('+ node --check docs/latest.js')
        subprocess.run(['node', '--check', 'docs/latest.js'], cwd=str(ROOT), check=True)
    print('done. review the diff, then test on device before pushing.')


if __name__ == '__main__':
    main()
