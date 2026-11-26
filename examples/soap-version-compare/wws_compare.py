#!/usr/bin/env python3
"""Compare the request schemas of two published Workday web-service (SOAP) versions.

    python wws_compare.py 46.2 47.1
    python wws_compare.py 46.2 47.1 --services Staffing Human_Resources --out report.md
    python wws_compare.py 46.2 47.1 --services Staffing --sent sent.json

Workday publishes the WSDL of every web-service version. This script downloads the two versions of each
service, lays every operation's request out as a flat list of element and attribute paths, and reports
what was added, removed, retyped or made required between the two.

With --sent it also answers the narrower question an integration owner has: "did anything I send go away,
change type, or gain a required sibling?". The file maps an operation to the element paths your request
contains, for example:

    {"Change_Job": ["Change_Job_Data/Worker_Reference", "Change_Job_Data/Change_Job_Detail_Data/Position_Reference"]}

Standard library only. Nothing is sent to a tenant: the only network calls are GETs for the published WSDLs.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

URL = "https://community.workday.com/sites/default/files/file-hosting/productionapi/{service}/v{version}/{service}.wsdl"
XS = "{http://www.w3.org/2001/XMLSchema}"
WSDL = "{http://schemas.xmlsoap.org/wsdl/}"
MAX_DEPTH = 7          # levels of nesting followed below the request element
MAX_PATHS = 60_000     # a guard against a schema that fans out without end
DEFAULT_SERVICES = ("Absence_Management", "Compensation", "Financial_Management", "Human_Resources", "Integrations", "Learning",
                    "Payroll", "Performance_Management", "Recruiting", "Resource_Management", "Staffing", "Talent", "Time_Tracking")


def local(name: str | None) -> str:
    return (name or "").split(":")[-1]


def words(path: str) -> str:
    return " > ".join(p.replace("_", " ").strip() for p in path.split("/") if p)


def fetch(service: str, version: str, cache: Path, retries: int = 5) -> bytes | None:
    """The published WSDL of one service and version, kept on disk once downloaded. None when it is not published."""
    path = cache / f"v{version}" / f"{service}.wsdl"
    if path.exists() and path.stat().st_size > 0:
        return path.read_bytes()
    url = URL.format(service=service, version=version)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "wws-compare"}), timeout=180) as r:
                raw = r.read()
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".part")
            tmp.write_bytes(raw)
            tmp.replace(path)
            return raw
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return None
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError):
            pass  # the files are several megabytes and the host drops connections mid-file: try again
        time.sleep(1.5 * 2 ** attempt)
    raise SystemExit(f"could not download {service} v{version} after {retries} attempts")


class Schema:
    """One service's WSDL, reduced to what a comparison needs."""

    def __init__(self, raw: bytes):
        root = ET.fromstring(raw)
        self.types = {t.get("name"): t for t in root.iter(XS + "complexType") if t.get("name")}
        self.elements: dict[str, str] = {}
        for schema in root.iter(XS + "schema"):
            for el in schema.findall(XS + "element"):
                if el.get("name"):
                    self.elements[el.get("name")] = local(el.get("type"))
        messages = {}
        for m in root.iter(WSDL + "message"):
            part = m.find(WSDL + "part")
            if part is not None and m.get("name"):
                messages[m.get("name")] = local(part.get("element"))
        self.operations: dict[str, str] = {}
        for port in root.iter(WSDL + "portType"):
            for op in port.findall(WSDL + "operation"):
                inp = op.find(WSDL + "input")
                element = messages.get(local(inp.get("message"))) if inp is not None else None
                if op.get("name"):
                    self.operations[op.get("name")] = element or f"{op.get('name')}_Request"

    def request(self, operation: str) -> dict[str, tuple[str, bool, bool]] | None:
        """path -> (type, required all the way down, required once its parent is sent)."""
        element = self.operations.get(operation)
        if element is None or element not in self.elements:
            return None
        out: dict[str, tuple[str, bool, bool]] = {}
        self._walk(self.elements[element], "", True, (), out)
        return out

    def _walk(self, type_name: str, prefix: str, parent_required: bool, stack: tuple[str, ...], out: dict) -> None:
        node = self.types.get(type_name)
        if node is None or type_name in stack or len(stack) >= MAX_DEPTH or len(out) >= MAX_PATHS:
            return
        for attr in node.iter(XS + "attribute"):
            name = attr.get("name") or local(attr.get("ref"))
            if name:
                own = attr.get("use") == "required"
                out[f"{prefix}/{name}"] = (local(attr.get("type")) or "attribute", parent_required and own, own)
        for el, in_choice in self._elements(node, False):
            name = el.get("name") or local(el.get("ref"))
            if not name:
                continue
            own = el.get("minOccurs", "1") != "0" and not in_choice   # one of several alternatives is never required by itself
            typ = local(el.get("type"))
            path = f"{prefix}/{name}"
            out[path] = (typ, parent_required and own, own)
            if typ in self.types:
                self._walk(typ, path, parent_required and own, (*stack, type_name), out)

    def _elements(self, node, in_choice: bool):
        for child in node:
            if child.tag == XS + "element":
                yield child, in_choice
            elif child.tag in (XS + "sequence", XS + "all", XS + "complexContent", XS + "extension"):
                yield from self._elements(child, in_choice)
            elif child.tag == XS + "choice":
                yield from self._elements(child, True)


def top(paths: set[str]) -> list[str]:
    """Only the highest path of each added or removed branch: its children say nothing more."""
    return sorted(p for p in paths if p.rsplit("/", 1)[0] not in paths)


def compare(old: dict, new: dict, sent: set[str] | None = None) -> dict:
    added, removed = set(new) - set(old), set(old) - set(new)
    both = set(old) & set(new)
    retyped = {p for p in both if old[p][0] != new[p][0]}
    now_required = {p for p in both if new[p][2] and not old[p][2]}
    new_required = [p for p in top(added) if new[p][1]]
    res = {"added": top(added), "removed": top(removed), "added_count": len(added), "removed_count": len(removed),
           "retyped": sorted(retyped), "now_required": sorted(now_required), "new_required": new_required,
           "changed": bool(added or removed or retyped or now_required)}
    if sent is not None:
        parent = lambda p: p.rsplit("/", 1)[0]  # noqa: E731
        res["breaks"] = {
            "sent_and_gone": sorted(p for p in removed if p in sent),
            "sent_and_retyped": sorted(p for p in retyped if p in sent),
            "must_now_send": sorted({p for p in top(added) if new[p][1] or (new[p][2] and parent(p) in sent)}
                                    | {p for p in now_required if p not in sent and (new[p][1] or parent(p) in sent)}),
        }
    return res


def main() -> None:
    ap = argparse.ArgumentParser(description="Compare the request schemas of two published Workday web-service versions.")
    ap.add_argument("old", help="the version in use, for example 46.2")
    ap.add_argument("new", help="the version to compare with, for example 47.1")
    ap.add_argument("--services", nargs="+", default=list(DEFAULT_SERVICES), help="service names as they appear in the WSDL URL")
    ap.add_argument("--cache", default=str(Path.home() / ".wws-compare"), help="where downloaded WSDLs are kept")
    ap.add_argument("--sent", help="JSON file: operation name -> list of element paths your request sends")
    ap.add_argument("--out", help="write the report to this Markdown file instead of the screen")
    args = ap.parse_args()

    sent_by_op = {k: {"/" + p.strip("/") for p in v} for k, v in (json.loads(Path(args.sent).read_text(encoding="utf-8")).items() if args.sent else ())}
    cache = Path(args.cache)
    totals = Counter()
    lines = [f"# Workday web-service request schemas: v{args.old} compared with v{args.new}", ""]
    verdicts: list[str] = []
    for service in args.services:
        old_raw, new_raw = fetch(service, args.old, cache), fetch(service, args.new, cache)
        label = service.replace("_", " ")
        if old_raw is None or new_raw is None:
            lines += [f"## {label}", "", "Not published for one of the two versions.", ""]
            continue
        old, new = Schema(old_raw), Schema(new_raw)
        fresh = sorted(set(new.operations) - set(old.operations))
        gone = sorted(set(old.operations) - set(new.operations))
        same, changed = 0, []
        for op in sorted(set(old.operations) & set(new.operations)):
            a, b = old.request(op), new.request(op)
            if a is None or b is None:
                continue
            res = compare(a, b, sent_by_op.get(op))
            if res["changed"]:
                changed.append((op, res))
            else:
                same += 1
            if op in sent_by_op:
                broken = any(res["breaks"].values())
                verdicts.append(f"- **{op.replace('_', ' ')}** ({label}): " + ("MUST CHANGE. " + "; ".join(
                    f"{k.replace('_', ' ')}: {', '.join(words(p) for p in v)}" for k, v in res["breaks"].items() if v) if broken
                    else "nothing you send is affected" + (" (the request did change elsewhere)" if res["changed"] else "")))
        required = [op for op, r in changed if r["new_required"] or r["now_required"]]
        totals.update(services=1, operations=len(new.operations), identical=same, changed=len(changed), new=len(fresh), removed=len(gone),
                      required=len(required))
        lines += [f"## {label}", "",
                  f"{len(new.operations)} operations in v{args.new}: {same} identical requests, {len(changed)} changed, {len(fresh)} new, {len(gone)} removed.", ""]
        if fresh:
            lines += ["New operations: " + ", ".join(o.replace("_", " ") for o in fresh) + ".", ""]
        if gone:
            lines += ["Removed operations: " + ", ".join(o.replace("_", " ") for o in gone) + ".", ""]
        if changed:
            lines += ["| Operation | Added | Removed | Retyped | First addition | First removal | Newly required |", "|---|---|---|---|---|---|---|"]
            for op, r in changed:
                req = r["new_required"] + r["now_required"]
                lines.append(f"| {op.replace('_', ' ')} | {r['added_count']} | {r['removed_count']} | {len(r['retyped'])} | "
                             f"{words(r['added'][0]) if r['added'] else ''} | {words(r['removed'][0]) if r['removed'] else ''} | "
                             f"{'; '.join(words(p) for p in req[:3])} |")
            lines.append("")
    head = [f"Services compared: {totals['services']}. Operations in v{args.new}: {totals['operations']:,}. Identical requests: {totals['identical']:,}. "
            f"Changed: {totals['changed']}. New operations: {totals['new']}. Removed operations: {totals['removed']}. "
            f"Operations with a newly required element: {totals['required']}.", "",
            "Requests only, not responses. Element paths are followed seven levels below the request element. "
            "This compares published schemas; it does not test what a tenant answers.", ""]
    if verdicts:
        head += ["## The requests you send", ""] + verdicts + [""]
    report = "\n".join(lines[:2] + head + lines[2:])
    if args.out:
        Path(args.out).write_text(report, encoding="utf-8", newline="\n")
        print(f"report written to {args.out}: {dict(totals)}")
    else:
        sys.stdout.write(report + "\n")


if __name__ == "__main__":
    main()
