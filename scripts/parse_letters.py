#!/usr/bin/env python3
"""Extract public.letters rows from the Supabase pg_dump COPY block into JSONL."""
import json, sys

DUMP = sys.argv[1] if len(sys.argv) > 1 else (
    "/private/tmp/claude-501/-Users-jazulynn-src-tries-Animate-Scene-Sequence/"
    "f54852de-8c5a-4bc3-929f-7ddbb26ae201/scratchpad/backup_dump.raw"
)
OUT = sys.argv[2] if len(sys.argv) > 2 else "scripts/letters.jsonl"

def unescape(field):
    if field == r"\N":
        return None
    out, i = [], 0
    while i < len(field):
        c = field[i]
        if c == "\\" and i + 1 < len(field):
            nxt = field[i + 1]
            out.append({"n": "\n", "t": "\t", "r": "\r", "\\": "\\"}.get(nxt, nxt))
            i += 2
        else:
            out.append(c)
            i += 1
    return "".join(out)

rows, in_block = [], False
with open(DUMP, encoding="utf-8") as f:
    for line in f:
        if line.startswith("COPY public.letters ("):
            in_block = True
            continue
        if in_block:
            if line.startswith("\\."):
                break
            parts = line.rstrip("\n").split("\t")  # cols: code, message, name, sent
            code, message, name, sent = (unescape(p) for p in parts)
            doc = {"code": code, "message": message}
            if name is not None:
                doc["name"] = name
            if sent is not None:
                doc["sent"] = (sent == "t")
            rows.append(doc)

with open(OUT, "w", encoding="utf-8") as f:
    for r in rows:
        f.write(json.dumps(r, ensure_ascii=False) + "\n")

print(f"wrote {len(rows)} rows to {OUT}")
