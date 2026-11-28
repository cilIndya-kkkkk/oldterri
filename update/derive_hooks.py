#!/usr/bin/env python3
import argparse
import json
import re
from collections import Counter, defaultdict

TOKEN_RE = re.compile(
    r'"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`|'
    r'[A-Za-z_$][A-Za-z0-9_$]*|\d+(?:\.\d+)?|.',
    re.S,
)


def tokenize(text):
    return TOKEN_RE.findall(text)


def is_identifier(token):
    return bool(re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*', token))


def is_number(token):
    return bool(re.fullmatch(r'\d+(?:\.\d+)?', token))


def is_string(token):
    return len(token) >= 2 and token[0] in '"\'`' and token[-1] == token[0]


def canonical(window):
    mapping = {}
    result = []
    for token in window:
        if is_identifier(token):
            if token not in mapping:
                mapping[token] = 'I%d' % len(mapping)
            result.append(mapping[token])
        elif is_number(token):
            result.append('N')
        elif is_string(token):
            result.append('S')
        else:
            result.append(token)
    return tuple(result)


def build_index(tokens, radius, max_candidates=40):
    index = defaultdict(list)
    width = radius * 2 + 1
    for center in range(radius, len(tokens) - radius):
        key = canonical(tokens[center - radius:center + radius + 1])
        bucket = index[key]
        if len(bucket) < max_candidates:
            bucket.append(center - radius)
    return index


def find_sequence(tokens, sequence):
    first = sequence[0]
    last = len(tokens) - len(sequence)
    for start in range(last + 1):
        if tokens[start] != first:
            continue
        if tokens[start:start + len(sequence)] == sequence:
            yield start


def resolve_path(old_tokens, new_tokens, index, path, radius):
    components = path.split('.')
    sequence = []
    for i, component in enumerate(components):
        if i:
            sequence.append('.')
        sequence.append(component)
    last_offset = len(sequence) - 1
    votes = Counter()
    valid = 0
    for occurrence in find_sequence(old_tokens, sequence):
        last = occurrence + last_offset
        window_start = last - radius
        if window_start < 0 or window_start + radius * 2 >= len(old_tokens):
            continue
        key = canonical(old_tokens[window_start:window_start + radius * 2 + 1])
        candidates = index.get(key)
        if not candidates:
            continue
        valid += 1
        base = occurrence - window_start
        for new_start in candidates:
            parts = []
            ok = True
            for p in range(len(components)):
                pos = new_start + base + p * 2
                if pos < 0 or pos >= len(new_tokens):
                    ok = False
                    break
                token = new_tokens[pos]
                if not is_identifier(token):
                    ok = False
                    break
                parts.append(token)
            if ok:
                votes['.'.join(parts)] += 1
    return votes, valid


def main():
    parser = argparse.ArgumentParser(description='Derive obfuscated hook names for a new game build.')
    parser.add_argument('--old', required=True, help='previous game script')
    parser.add_argument('--new', required=True, help='new game script')
    parser.add_argument('--hooks', required=True, help='hooks json')
    parser.add_argument('--out', default='hooks.resolved.json')
    parser.add_argument('--radius', type=int, default=14)
    parser.add_argument('--min-votes', type=int, default=1)
    args = parser.parse_args()

    with open(args.old, encoding='utf-8') as f:
        old_text = f.read()
    with open(args.new, encoding='utf-8') as f:
        new_text = f.read()
    with open(args.hooks, encoding='utf-8') as f:
        hooks = json.load(f)

    old_tokens = tokenize(old_text)
    new_tokens = tokenize(new_text)
    index = build_index(new_tokens, args.radius)

    resolved = {}
    unresolved = []
    report = {}
    for hook_id, spec in hooks['hooks'].items():
        path = spec['path']
        votes, valid = resolve_path(old_tokens, new_tokens, index, path, args.radius)
        if not votes:
            unresolved.append(hook_id)
            report[hook_id] = {'path': path, 'valid': valid, 'votes': {}}
            continue
        best_path, best_count = votes.most_common(1)[0]
        if best_count < args.min_votes:
            unresolved.append(hook_id)
            report[hook_id] = {
                'path': path,
                'valid': valid,
                'best': best_path,
                'best_count': best_count,
                'votes': votes.most_common(5),
            }
            continue
        if spec.get('full'):
            value = best_path
        else:
            component = spec.get('component', len(path.split('.')) - 1)
            value = best_path.split('.')[component]
        resolved[hook_id] = value
        report[hook_id] = {
            'path': path,
            'valid': valid,
            'best': best_path,
            'best_count': best_count,
            'votes': votes.most_common(5),
            'value': value,
        }

    output = {
        'resolved': resolved,
        'unresolved': unresolved,
        'report': report,
    }
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print('resolved: %d, unresolved: %d' % (len(resolved), len(unresolved)))
    for hook_id in unresolved:
        print('UNRESOLVED', hook_id, json.dumps(report[hook_id], ensure_ascii=False))
    if unresolved:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
