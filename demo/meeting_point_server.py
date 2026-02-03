"""
多人会面点计算服务（百度地图 Web 服务 API）

功能：
- 根据多人位置与出行方式（步行/驾车/公交/骑行）
- 从指定 POI 类型中筛选候选会面点
- 计算每人到达时长并做公平性排序
- 返回 Top K 候选点

使用说明：
1) 配置环境变量 BAIDU_WEB_AK（服务端 AK）
2) 安装依赖：pip install flask requests
3) 运行：python meeting_point_server.py
4) 打开浏览器访问：http://127.0.0.1:5000
"""

from __future__ import annotations

import os
import math
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import requests
from flask import Flask, Response, jsonify, request, send_from_directory


APP_DIR = os.path.dirname(os.path.abspath(__file__))
BAIDU_BASE = "https://api.map.baidu.com"
PLACE_AROUND_URL = f"{BAIDU_BASE}/place/v3/around"
DRIVING_URL = f"{BAIDU_BASE}/direction/v2/driving"
TRANSIT_URL = f"{BAIDU_BASE}/direction/v2/transit"
WALKING_URL = f"{BAIDU_BASE}/direction/v2/walking"
RIDING_URL = f"{BAIDU_BASE}/direction/v2/riding"


def _load_env() -> None:
    candidates = [
        os.path.join(APP_DIR, ".env"),
        os.path.join(os.path.dirname(APP_DIR), ".env"),
    ]
    for path in candidates:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, value = line.split("=", 1)
                    key = key.strip()
                    value = value.strip().strip('"').strip("'")
                    if key and key not in os.environ:
                        os.environ[key] = value
        except OSError:
            continue


_load_env()
BAIDU_WEB_AK = os.getenv("BAIDU_WEB_AK", "")

app = Flask(__name__)


@dataclass
class Person:
    name: str
    lat: float
    lng: float
    mode: str
    depart_time: str = ""


def _call_baidu(url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    params["output"] = "json"
    params["ak"] = BAIDU_WEB_AK
    print(f"[DEBUG] 请求 URL: {url}")
    print(f"[DEBUG] 参数: {params}")
    response = requests.get(url, params=params, timeout=12)
    response.raise_for_status()
    result = response.json()
    print(f"[DEBUG] 响应: status={result.get('status')}, message={result.get('message')}")
    return result


def _get_centroid(points: List[Person]) -> Dict[str, float]:
    if not points:
        return {"lat": 0.0, "lng": 0.0}
    lat = sum(p.lat for p in points) / len(points)
    lng = sum(p.lng for p in points) / len(points)
    return {"lat": lat, "lng": lng}


def _place_search_around(center: Dict[str, float], query: str, radius: int, page_size: int) -> List[Dict[str, Any]]:
    params = {
        "query": query,
        "location": f"{center['lat']},{center['lng']}",
        "radius": radius,
        "page_size": page_size,
        "page_num": 0,
    }
    data = _call_baidu(PLACE_AROUND_URL, params)
    if data.get("status") != 0:
        return []
    return data.get("results", [])


def _route_duration_seconds(person: Person, dest_lat: float, dest_lng: float, city: str) -> Optional[int]:
    origin = f"{person.lat},{person.lng}"
    destination = f"{dest_lat},{dest_lng}"
    mode = person.mode.lower().strip()

    if mode == "driving":
        params = {
            "origin": origin,
            "destination": destination,
            "tactics": 10,
        }
        if person.depart_time:
            params["departure_time"] = person.depart_time
        data = _call_baidu(DRIVING_URL, params)
    elif mode == "transit":
        if not city:
            return None
        params = {
            "origin": origin,
            "destination": destination,
            "city": city,
            "tactics_incity": 0,
        }
        if person.depart_time:
            params["departure_time"] = person.depart_time
        data = _call_baidu(TRANSIT_URL, params)
    elif mode == "walking":
        params = {
            "origin": origin,
            "destination": destination,
        }
        data = _call_baidu(WALKING_URL, params)
    elif mode == "riding":
        params = {
            "origin": origin,
            "destination": destination,
        }
        data = _call_baidu(RIDING_URL, params)
    else:
        return None

    if data.get("status") != 0:
        return None

    routes = data.get("result", {}).get("routes", [])
    if not routes:
        return None

    duration = routes[0].get("duration")
    if duration is None:
        return None
    return int(duration)


def _score_times(times: List[int]) -> Dict[str, Any]:
    max_time = max(times)
    min_time = min(times)
    avg_time = sum(times) / len(times)
    gap = max_time - min_time
    score = max_time + 0.35 * gap
    variance = sum((t - avg_time) ** 2 for t in times) / len(times)
    std = math.sqrt(variance)
    return {
        "max_time": int(max_time),
        "min_time": int(min_time),
        "avg_time": int(avg_time),
        "gap": int(gap),
        "std": round(std, 2),
        "score": round(score, 2),
    }


@app.after_request
def _add_cors_headers(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
    resp.headers["Access-Control-Allow-Methods"] = "POST, GET, OPTIONS"
    return resp


@app.route("/")
def index():
    return send_from_directory(APP_DIR, "meeting_point.html")


@app.route("/favicon.ico")
def favicon():
    return Response(status=204)


@app.route("/api/meeting_points", methods=["POST", "OPTIONS"])
def meeting_points():
    if request.method == "OPTIONS":
        return ("", 204)

    if not BAIDU_WEB_AK:
        return jsonify({"error": "缺少 BAIDU_WEB_AK 环境变量"}), 400

    payload = request.get_json(silent=True) or {}
    persons_payload = payload.get("persons", [])
    if not persons_payload:
        return jsonify({"error": "persons 不能为空"}), 400

    persons: List[Person] = []
    for item in persons_payload:
        try:
            persons.append(
                Person(
                    name=str(item.get("name") or ""),
                    lat=float(item.get("lat")),
                    lng=float(item.get("lng")),
                    mode=str(item.get("mode") or "walking"),
                    depart_time=str(item.get("depart_time") or ""),
                )
            )
        except (TypeError, ValueError):
            return jsonify({"error": "persons 参数格式错误"}), 400

    query = str(payload.get("query") or "咖啡厅$商场$地铁站")
    radius = int(payload.get("radius") or 3000)
    top_k = int(payload.get("top_k") or 5)
    city = str(payload.get("city") or "")
    page_size = int(payload.get("page_size") or 20)

    center = _get_centroid(persons)
    candidates = _place_search_around(center, query, radius, page_size)

    results: List[Dict[str, Any]] = []
    for c in candidates:
        location = c.get("location") or {}
        lat = location.get("lat")
        lng = location.get("lng")
        if lat is None or lng is None:
            continue

        times: List[int] = []
        valid = True
        for p in persons:
            duration = _route_duration_seconds(p, float(lat), float(lng), city)
            if duration is None:
                valid = False
                break
            times.append(duration)

        if not valid:
            continue

        metrics = _score_times(times)
        results.append(
            {
                "name": c.get("name"),
                "address": c.get("address"),
                "uid": c.get("uid"),
                "location": {"lat": float(lat), "lng": float(lng)},
                "times": times,
                **metrics,
            }
        )

    results.sort(key=lambda x: x["score"])
    return jsonify(
        {
            "center": center,
            "candidates": results[: max(top_k, 1)],
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
