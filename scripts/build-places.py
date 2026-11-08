#!/usr/bin/env python3
"""Ģenerē data/places-lv.json no VZD Valsts adrešu reģistra atvērtajiem datiem (data.gov.lv, CC BY 4.0).
Novadi → pilsētas, pagasti → ciemi ar centroīdu koordinātām. Valstspilsētu apkaimes paliek data/locations.json.

Lietošana: python3 scripts/build-places.py <mape ar aw_novads.csv, aw_pagasts.csv, aw_pilseta.csv, aw_ciems.csv, aw_vietu_centroidi.csv>
Faili: https://data.gov.lv/dati/lv/dataset/varis-atvertie-dati
"""
import csv, json, sys, os
from collections import defaultdict

src = sys.argv[1]
rd = lambda f: [r for r in csv.DictReader(open(os.path.join(src, f), encoding="utf-8-sig")) if r["STATUSS"] == "EKS"]
cent = {r["KODS"]: (round(float(r["DD_N"]), 5), round(float(r["DD_E"]), 5)) for r in csv.DictReader(open(os.path.join(src, "aw_vietu_centroidi.csv"), encoding="utf-8-sig")) if r["DD_N"]}

novadi = {r["KODS"]: r["SORT_NOS"] for r in rd("aw_novads.csv")}  # "Ādažu novads"
out = {code: {"region": name, "towns": [], "parishes": []} for code, name in novadi.items()}
parish_by_code = {}
for r in rd("aw_pagasts.csv"):
    if r["VKUR_CD"] not in out or r["KODS"] not in cent:
        continue
    lat, lon = cent[r["KODS"]]
    p = {"code": r["KODS"], "name": r["SORT_NOS"], "lat": lat, "lon": lon, "villages": []}
    out[r["VKUR_CD"]]["parishes"].append(p)
    parish_by_code[r["KODS"]] = p
for r in rd("aw_pilseta.csv"):
    if r["VKUR_CD"] in out and r["KODS"] in cent:
        lat, lon = cent[r["KODS"]]
        out[r["VKUR_CD"]]["towns"].append({"code": r["KODS"], "name": r["NOSAUKUMS"], "lat": lat, "lon": lon})
skipped = 0
for r in rd("aw_ciems.csv"):
    p = parish_by_code.get(r["VKUR_CD"])
    if not p or r["KODS"] not in cent:
        skipped += 1
        continue
    lat, lon = cent[r["KODS"]]
    p["villages"].append({"code": r["KODS"], "name": r["NOSAUKUMS"], "lat": lat, "lon": lon})

res = sorted(out.values(), key=lambda x: x["region"])
for x in res:
    x["towns"].sort(key=lambda t: t["name"])
    x["parishes"].sort(key=lambda t: t["name"])
    for p in x["parishes"]:
        p["villages"].sort(key=lambda t: t["name"])
dst = os.path.join(os.path.dirname(__file__), "..", "data", "places-lv.json")
json.dump(res, open(dst, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(len(res), "novadi;", sum(len(x["towns"]) for x in res), "pilsētas;", sum(len(x["parishes"]) for x in res), "pagasti;",
      sum(len(p["villages"]) for x in res for p in x["parishes"]), "ciemi; bez pagasta/koordinātām:", skipped, "→", os.path.getsize(dst), "B")
