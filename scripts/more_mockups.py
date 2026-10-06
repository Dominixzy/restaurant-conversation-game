"""Mockup art for Spicy Market (thai/, a som tam shop), Lumière Café (cafe/) and Route 66 (diner/).

Placeholders until real art exists, drawn like the Italian set (see italian_mockups.py):
plate layers share a 512x512 canvas centred on (256, 270); stacked items (burger, macarons,
pancakes) are drawn centred in their own canvas and stacked by the game using "lift".

Run:  python3 scripts/more_mockups.py
"""
import math
import os
import random

from italian_mockups import CX, CY, GRADS, INK, bowl, leaf, scatter, svg

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "food")


def saver(folder):
    def save(name, body, w=512, h=512, defs=GRADS + EXTRA):
        path = os.path.join(ROOT, folder, name)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(svg(body, w, h, defs))
    return save


EXTRA = """
<radialGradient id="noodle" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#f6ecd2"/><stop offset="1" stop-color="#e2d2a8"/></radialGradient>
<radialGradient id="padthai" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#f0a85a"/><stop offset="1" stop-color="#cf7a35"/></radialGradient>
<radialGradient id="mango" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="#f29a1f"/></radialGradient>
<radialGradient id="bun" cx="45%" cy="30%" r="80%"><stop offset="0" stop-color="#f2b866"/><stop offset="1" stop-color="#c47a2f"/></radialGradient>
<radialGradient id="patty" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#7a4a2c"/><stop offset="1" stop-color="#4a2814"/></radialGradient>
<radialGradient id="pattyRaw" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#e8848a"/><stop offset="1" stop-color="#b9505a"/></radialGradient>
<radialGradient id="pancake" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#f5c77a"/><stop offset="1" stop-color="#d48d3c"/></radialGradient>
<radialGradient id="batter" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#fff4d6"/><stop offset="1" stop-color="#f0dca8"/></radialGradient>
<radialGradient id="fries" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="#ffd970"/><stop offset="1" stop-color="#e3a531"/></radialGradient>
"""


def ell(cx, cy, rx, ry, fill, stroke=INK, sw=4, extra=""):
    return f'<ellipse cx="{cx:.0f}" cy="{cy:.0f}" rx="{rx:.0f}" ry="{ry:.0f}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" {extra}/>'


def shadow(rx, ry, cy=CY + 14):
    return f'<ellipse cx="{CX}" cy="{cy}" rx="{rx}" ry="{ry}" fill="#000" opacity=".16"/>'


def noodles(colour_outer, colour_inner, seed=41, count=60, rx=150, ry=86):
    rnd = random.Random(seed)
    out = ell(CX, CY + 6, rx - 10, ry - 8, colour_inner, sw=0)
    for _ in range(count):
        a = rnd.uniform(0, 2 * math.pi)
        x0, y0 = CX + math.cos(a) * rnd.uniform(10, rx - 20), CY + 6 + math.sin(a) * rnd.uniform(6, ry - 14)
        x1, y1 = CX + math.cos(a + 2) * rnd.uniform(10, rx - 20), CY + 6 + math.sin(a + 2) * rnd.uniform(6, ry - 14)
        mx, my = (x0 + x1) / 2 + rnd.uniform(-50, 50), (y0 + y1) / 2 + rnd.uniform(-40, 20)
        out += f'<path d="M {x0:.0f} {y0:.0f} Q {mx:.0f} {my:.0f} {x1:.0f} {y1:.0f}" stroke="{colour_outer}" stroke-width="6" fill="none" stroke-linecap="round"/>'
        out += f'<path d="M {x0:.0f} {y0:.0f} Q {mx:.0f} {my:.0f} {x1:.0f} {y1:.0f}" stroke="{colour_inner}" stroke-width="3" fill="none" stroke-linecap="round"/>'
    return out


def sprinkle(seed, n, colour, rx=110, ry=60, size=(4, 8), dy=-10, stroke=None):
    rnd = random.Random(seed)
    out = ""
    for _ in range(n):
        x, y = CX + rnd.gauss(0, rx / 2.2), CY + dy + rnd.gauss(0, ry / 2.2)
        w = rnd.uniform(*size)
        st = f'stroke="{stroke}" stroke-width="1"' if stroke else ""
        out += f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{w * .7:.0f}" rx="2" fill="{colour}" {st} transform="rotate({rnd.uniform(0, 90):.0f} {x:.0f} {y:.0f})"/>'
    return out


# =============================================================== THAI (Spicy Market, som tam)

def thai():
    """Som tam (green papaya salad) made in a clay mortar."""
    save = saver("thai")
    R = random.Random

    def chili_pod(x, y, rot, s=1.0):
        return (f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot}) scale({s})">'
                f'<path d="M -46 -4 C -20 -16, 30 -12, 50 8 C 26 6, -10 10, -46 6 Z" fill="#d42a1c" stroke="{INK}" stroke-width="3"/>'
                f'<path d="M -46 0 L -60 -8" stroke="#3f9a3c" stroke-width="7" stroke-linecap="round"/>'
                f'<path d="M -30 -6 C -10 -12, 16 -10, 34 0" stroke="#ff7a5c" stroke-width="3" fill="none" opacity=".7"/></g>')

    def garlic_clove(x, y, rot):
        return (f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot})"><path d="M -20 14 C -26 -8, -6 -26, 4 -28 C 12 -20, 26 -4, 20 14 C 10 22, -10 22, -20 14 Z" fill="#fbf4e2" stroke="{INK}" stroke-width="3"/>'
                f'<path d="M 4 -28 C 2 -10, 2 6, 0 18" stroke="#e6dcc0" stroke-width="3" fill="none"/></g>')

    def tomato_half(x, y, rot):
        return (f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot})"><ellipse rx="22" ry="18" fill="#e8402e" stroke="{INK}" stroke-width="3"/>'
                f'<ellipse rx="15" ry="11" fill="#ff7a5c"/><circle cx="-5" cy="0" r="3" fill="#ffd2a0"/><circle cx="6" cy="2" r="3" fill="#ffd2a0"/></g>')

    def dried_shrimp(x, y, rot):
        return (f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot})"><path d="M -14 0 C -14 -14, 12 -16, 15 -3 C 16 4, 9 8, 4 6 C 8 2, 6 -5, 0 -5 C -6 -5, -8 2, -4 7 L -11 9 Z" fill="#ff8a5c" stroke="{INK}" stroke-width="2"/></g>')

    def crab(x, y, rot):
        return (f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot})"><ellipse rx="20" ry="14" fill="#3a2a22" stroke="{INK}" stroke-width="3"/>'
                + "".join(f'<path d="M {sx * 16} 4 L {sx * 30} {12 + i * 6}" stroke="#3a2a22" stroke-width="4" stroke-linecap="round"/>' for sx in (-1, 1) for i in range(2))
                + f'<circle cx="-6" cy="-4" r="3" fill="#8a6a5a"/></g>')

    def strands(seed, n, colours, rx=150, ry=90):
        rnd, out = R(seed), ""
        for _ in range(n):
            x, y = CX + rnd.uniform(-rx, rx) * .8, CY + rnd.uniform(-ry, ry) * .7
            a = rnd.uniform(0, math.pi)
            dx, dy = math.cos(a) * 40, math.sin(a) * 16
            c = rnd.choice(colours)
            out += f'<path d="M {x - dx:.0f} {y - dy:.0f} Q {x + rnd.uniform(-10, 10):.0f} {y - 14:.0f} {x + dx:.0f} {y + dy:.0f}" stroke="{c}" stroke-width="7" fill="none" stroke-linecap="round"/>'
        return out

    # what is in the mortar at each step (all centred where the mortar bowl is)
    garlic = "".join(garlic_clove(CX + dx, CY + dy, r) for dx, dy, r in [(-40, 0, -20), (10, -16, 15), (40, 14, 40)])
    chilis = [chili_pod(CX - 10, CY + 24, 10), chili_pod(CX + 20, CY - 26, -25), chili_pod(CX - 50, CY - 20, 35)]
    def paste(level):
        red = ["#c8902a", "#c8642a", "#b8341a"][level - 1]
        rnd = R(70 + level)
        return (f'<path d="M {CX - 100} {CY + 6} C {CX - 96} {CY - 40}, {CX + 90} {CY - 46}, {CX + 104} {CY + 4} C {CX + 90} {CY + 40}, {CX - 90} {CY + 44}, {CX - 100} {CY + 6} Z" fill="{red}" opacity=".9"/>'
                + "".join(f'<circle cx="{CX + rnd.uniform(-80, 80):.0f}" cy="{CY + rnd.uniform(-26, 26):.0f}" r="{rnd.uniform(3, 7):.0f}" fill="{rnd.choice(["#e8402e", "#fbf4e2", "#8a1a10", "#3f9a3c"])}"/>' for _ in range(16 + level * 10)))
    tomatoes = "".join(tomato_half(CX + dx, CY + dy, r) for dx, dy, r in [(-70, -10, 10), (60, -20, -20), (-10, 30, 30), (80, 30, 0)])
    shrimp = "".join(dried_shrimp(CX + R(80 + i).uniform(-110, 110), CY + R(181 + i).uniform(-50, 50), i * 40) for i in range(9))
    crabs = "".join(crab(CX + dx, CY + dy, r) for dx, dy, r in [(-60, 10, 20), (50, -20, -30), (10, 40, 10)])
    peanuts = sprinkle(51, 40, "#d8a35c", rx=200, ry=110, size=(6, 11), stroke="#8a5a28", dy=0)
    sugar = "".join(f'<path d="M {CX + dx} {CY + dy} l 18 -6 l 10 14 l -16 10 Z" fill="#c8862a" stroke="{INK}" stroke-width="2"/>' for dx, dy in [(-40, -20), (30, 10), (-10, 30)])
    fish_sauce = f'<path d="M {CX - 90} {CY - 10} C {CX - 40} {CY - 40}, {CX + 40} {CY + 30}, {CX + 100} {CY - 6}" stroke="#8a4a10" stroke-width="12" fill="none" stroke-linecap="round" opacity=".75"/>'

    def lime_wedge(x, y, s=1.0, rot=0):
        return (f'<g transform="translate({x} {y}) rotate({rot}) scale({s})"><path d="M -40 0 A 40 40 0 0 1 40 0 Z" fill="#9ccf4a" stroke="{INK}" stroke-width="4"/>'
                f'<path d="M -30 -2 A 30 30 0 0 1 30 -2 Z" fill="#d9f08a"/>' + "".join(f'<line x1="0" y1="-2" x2="{30 * math.cos(math.pi + a):.0f}" y2="{-2 + 30 * math.sin(math.pi + a):.0f}" stroke="#9ccf4a" stroke-width="2"/>' for a in [0.5, 1.0, 1.6, 2.1, 2.6]) + "</g>")
    limes = lime_wedge(CX - 60, CY + 10, .8, -20) + lime_wedge(CX + 70, CY - 10, .8, 25)
    papaya = strands(90, 90, ["#cfe8a0", "#e8f4c8", "#b6d77a", "#f6fbe6"])

    def salad(poo=False, nuts=True, level=1):
        base = f'<path d="M {CX - 150} {CY + 20} C {CX - 160} {CY - 70}, {CX + 160} {CY - 80}, {CX + 150} {CY + 20} C {CX + 110} {CY + 60}, {CX - 110} {CY + 60}, {CX - 150} {CY + 20} Z" fill="{"#c9c08a" if poo else "#d8e8a0"}" opacity=".9"/>'
        heap = strands(91, 110, ["#c8b870", "#b9a85a", "#d8d08a"] if poo else ["#d8ecaa", "#c6e08a", "#eef6d6", "#e8a058"])
        extras = tomatoes.replace('rx="22"', 'rx="20"') + "".join(f'<path d="M {CX + dx} {CY + dy} l 50 -8" stroke="#3f9a3c" stroke-width="9" stroke-linecap="round"/>' for dx, dy in [(-100, -20), (20, 20), (-30, -40)])
        extras += crabs if poo else shrimp
        if nuts:
            extras += peanuts
        extras += "".join(chili_pod(CX + dx, CY + dy, r, .6) for dx, dy, r in [(-110, 10, 20), (100, -30, -30), (40, 30, 60)][:level])
        return base + heap + extras + lime_wedge(CX + 150, CY + 30, .7)

    save("garlic.svg", garlic)
    save("chili.svg", chilis[0])
    save("chili-2.svg", chilis[0] + chilis[1])
    save("chili-3.svg", "".join(chilis))
    for level in (1, 2, 3):
        save(f"paste-{level}.svg", paste(level))
    save("cherry-tomato.svg", tomatoes)
    save("dried-shrimp.svg", shrimp)
    save("salted-crab.svg", crabs)
    save("peanuts.svg", peanuts)
    save("palm-sugar.svg", sugar)
    save("fish-sauce.svg", fish_sauce)
    save("lime.svg", limes)
    save("papaya.svg", papaya)
    save("som-tam-thai.svg", salad(level=1))
    save("som-tam-thai-no-peanuts.svg", salad(nuts=False, level=1))
    save("som-tam-poo.svg", salad(poo=True, nuts=False, level=3))

    # bin icons
    save("icons/garlic.svg", f'<g transform="translate(-256 -270) scale(2)">{garlic}</g>')
    save("icons/chili.svg", chili_pod(256, 256, -30, 3.2))
    save("icons/tomato.svg", "".join(tomato_half(x, y, r).replace(f"rotate({r})", f"rotate({r}) scale(3)") for x, y, r in [(200, 260, 0), (320, 280, 20)]))
    save("icons/dried-shrimp.svg", "".join(dried_shrimp(x, y, r).replace(f"rotate({r})", f"rotate({r}) scale(4)") for x, y, r in [(200, 220, 0), (310, 300, 40)]))
    save("icons/salted-crab.svg", crab(256, 256, 0).replace("rotate(0)", "rotate(0) scale(5)"))
    peanut = '<path d="M -40 -20 C -60 -20, -60 20, -40 20 C -20 20, -20 10, 0 10 C 20 10, 20 20, 40 20 C 60 20, 60 -20, 40 -20 C 20 -20, 20 -10, 0 -10 C -20 -10, -20 -20, -40 -20 Z" fill="#d8a35c" stroke="%s" stroke-width="4"/>' % INK
    save("icons/peanuts.svg", "".join(f'<g transform="translate({x} {y}) rotate({r}) scale(2)">{peanut}</g>' for x, y, r in [(220, 220, -20), (300, 300, 25)]))
    save("icons/palm-sugar.svg", f'<ellipse cx="256" cy="330" rx="150" ry="40" fill="#000" opacity=".12"/><path d="M 120 300 C 120 220, 392 220, 392 300 C 392 340, 120 340, 120 300 Z" fill="#c8862a" stroke="{INK}" stroke-width="6"/><ellipse cx="256" cy="270" rx="120" ry="34" fill="#e0a850"/>')
    save("icons/fish-sauce.svg", f'<path d="M 200 200 L 312 200 L 320 420 C 310 440, 202 440, 192 420 Z" fill="#8a4a10" stroke="{INK}" stroke-width="6" opacity=".95"/><rect x="230" y="110" width="52" height="96" rx="8" fill="#8a4a10" stroke="{INK}" stroke-width="5"/><rect x="226" y="96" width="60" height="26" rx="6" fill="#d42a1c" stroke="{INK}" stroke-width="5"/><rect x="204" y="280" width="104" height="70" rx="8" fill="#fff4dc" stroke="{INK}" stroke-width="4"/>')
    save("icons/lime.svg", lime_wedge(256, 300, 4))
    save("icons/papaya.svg", f'<path d="M 256 90 C 360 90, 400 300, 360 380 C 330 440, 182 440, 152 380 C 112 300, 152 90, 256 90 Z" fill="#7cb342" stroke="{INK}" stroke-width="6"/><path d="M 210 140 C 190 200, 190 280, 210 340" stroke="#b6e07a" stroke-width="14" fill="none" stroke-linecap="round" opacity=".6"/>')

    def mortar_icon(pestle_angle):
        return (f'<path d="M 110 240 C 110 400, 402 400, 402 240 Z" fill="#b8642e" stroke="{INK}" stroke-width="6"/><ellipse cx="256" cy="240" rx="146" ry="40" fill="#7a3a16" stroke="{INK}" stroke-width="6"/>'
                f'<g transform="rotate({pestle_angle} 256 240)"><rect x="236" y="60" width="44" height="200" rx="22" fill="#d9a066" stroke="{INK}" stroke-width="6"/></g>')
    save("icons/mortar.svg", mortar_icon(20))
    save("icons/spoon.svg", f'<g transform="rotate(-35 256 256)"><rect x="244" y="120" width="24" height="280" rx="12" fill="#d9a066" stroke="{INK}" stroke-width="6"/><ellipse cx="256" cy="120" rx="54" ry="74" fill="#d9a066" stroke="{INK}" stroke-width="6"/></g>'
         + "".join(f'<path d="M {x} 420 q 20 -30 40 0" stroke="#b6d77a" stroke-width="10" fill="none" stroke-linecap="round"/>' for x in (130, 200, 280)))

    # scene: the mortar is the "plate", on a woven mat
    save("plate.svg", f'<ellipse cx="256" cy="286" rx="240" ry="160" fill="#000" opacity=".2"/><ellipse cx="256" cy="262" rx="240" ry="164" fill="#b8642e" stroke="{INK}" stroke-width="6"/>'
         f'<ellipse cx="256" cy="262" rx="214" ry="142" fill="#8a4420" stroke="#6a3010" stroke-width="5"/><ellipse cx="256" cy="270" rx="190" ry="122" fill="#6e3416"/>'
         + "".join(f'<path d="M {256 + 200 * math.cos(a):.0f} {262 + 134 * math.sin(a):.0f} l 6 4" stroke="#c87a46" stroke-width="3"/>' for a in [i * 0.5 for i in range(13)]))
    weave = "".join(f'<rect x="{x}" y="0" width="22" height="512" fill="{"#d9b27a" if (x // 32) % 2 else "#c49a5c"}"/>' for x in range(0, 512, 32))
    save("mat.svg", f'<g transform="translate(256 256) scale(1 .62) translate(-256 -256)"><rect width="512" height="512" rx="30" fill="#e6c48a"/>{weave}<rect width="512" height="512" rx="30" fill="none" stroke="#8a5a28" stroke-width="10"/></g>')
    w, h = 1672, 941
    stalls = "".join(
        f'<rect x="{x}" y="230" width="300" height="300" fill="#2b2238"/>'
        + "".join(f'<path d="M {x + i * 50} 200 L {x + i * 50 + 50} 200 L {x + i * 50 + 50} 250 C {x + i * 50 + 38} 270, {x + i * 50 + 12} 270, {x + i * 50} 250 Z" fill="{c if i % 2 else "#fff4e0"}"/>' for i in range(6))
        + f'<ellipse cx="{x + 150}" cy="470" rx="110" ry="30" fill="#7cb342"/>' + "".join(f'<ellipse cx="{x + 70 + i * 40}" cy="{440 - (i % 2) * 12}" rx="22" ry="34" fill="#7cb342" stroke="#4a7a22" stroke-width="3"/>' for i in range(5))
        + "".join(f'<path d="M {x + 40 + i * 50} 320 l 30 -6" stroke="#d42a1c" stroke-width="10" stroke-linecap="round"/>' for i in range(5))
        for x, c in [(80, "#d42a1c"), (520, "#2f8f6a"), (960, "#e0a020"), (1360, "#8e44ad")])
    lanterns = "".join(f'<g><line x1="{x}" y1="0" x2="{x}" y2="{y - 30}" stroke="#222" stroke-width="3"/><ellipse cx="{x}" cy="{y}" rx="26" ry="34" fill="#ff5a3c"/><ellipse cx="{x}" cy="{y}" rx="50" ry="56" fill="#ff8a4a" opacity=".22"/></g>' for x, y in [(160, 120), (420, 90), (700, 130), (980, 100), (1240, 130), (1520, 95)])
    body = (f'<rect width="{w}" height="{h}" fill="url(#night)"/>' + "".join(f'<circle cx="{R(i).uniform(0, w):.0f}" cy="{R(i + 7).uniform(0, 180):.0f}" r="2" fill="#fff" opacity=".7"/>' for i in range(40))
            + stalls + lanterns
            + f'<rect x="610" y="34" width="450" height="110" rx="14" fill="#1d1630" stroke="#ff5a3c" stroke-width="6"/><text x="835" y="92" font-family="Arial Rounded MT Bold, Arial, sans-serif" font-size="46" fill="#ffd84d" text-anchor="middle">Spicy Market</text>'
            + f'<text x="835" y="130" font-family="Arial, sans-serif" font-size="26" fill="#9ccf4a" text-anchor="middle">SOM TAM · PAPAYA SALAD</text>'
            + f'<rect y="560" width="{w}" height="{h - 560}" fill="#b98a5a"/>' + "".join(f'<rect y="{y}" width="{w}" height="2" fill="#8a6038" opacity=".5"/>' for y in range(600, h, 46)) + f'<rect y="556" width="{w}" height="8" fill="#e2b98a"/>')
    save("dining.svg", body, w, h, '<linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1440"/><stop offset=".6" stop-color="#4a2a5a"/><stop offset="1" stop-color="#2b2238"/></linearGradient>')
    steel = f'<rect width="{w}" height="{h}" fill="url(#steel)"/>' + "".join(f'<rect y="{y}" width="{w}" height="2" fill="#fff" opacity=".25"/>' for y in range(240, h, 90))
    bowls = "".join(ell(300 + i * 180, 120, 70, 42, "#f7f2ea") + ell(300 + i * 180, 118, 52, 28, c, "none", 0) for i, c in enumerate(["#fbf4e2", "#d42a1c", "#e8402e", "#ff8a5c", "#d8a35c", "#c8862a", "#9ccf4a"]))
    papayas = "".join(f'<g transform="translate({x} {y}) rotate({r})"><path d="M 0 -60 C 50 -60, 64 40, 40 70 C 20 90, -20 90, -40 70 C -64 40, -50 -60, 0 -60 Z" fill="#7cb342" stroke="{INK}" stroke-width="4"/></g>' for x, y, r in [(180, 600, -20), (260, 640, 15), (210, 720, 40)])
    save("counter.svg", steel + f'<rect width="{w}" height="200" fill="#5a4636"/>' + bowls + papayas
         + f'<g transform="translate(1500 640)"><ellipse rx="110" ry="40" fill="#d9b27a" stroke="{INK}" stroke-width="4"/>' + "".join(f'<path d="M {-90 + i * 30} -10 q 15 -20 30 0" stroke="#e8f4c8" stroke-width="8" fill="none"/>' for i in range(6)) + "</g>",
         w, h, '<linearGradient id="steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d7dde2"/><stop offset="1" stop-color="#9aa6b0"/></linearGradient>')


# =============================================================== CAFE (Lumière Café)

def cafe():
    save = saver("cafe")

    def macaron(colour, filling="#fffaf0", cx=256, cy=256, s=1.0):
        return (f'<g transform="translate({cx} {cy}) scale({s})">'
                f'<ellipse cx="0" cy="40" rx="150" ry="44" fill="#000" opacity=".12"/>'
                f'<path d="M -150 20 C -150 60, 150 60, 150 20 L 150 6 C 150 -10, -150 -10, -150 6 Z" fill="{colour}" stroke="{INK}" stroke-width="5"/>'
                f'<path d="M -140 8 L 140 8" stroke="{filling}" stroke-width="16" stroke-linecap="round"/>'
                f'<path d="M -150 -8 C -150 -70, 150 -70, 150 -8 C 150 6, -150 6, -150 -8 Z" fill="{colour}" stroke="{INK}" stroke-width="5"/>'
                f'<path d="M -90 -40 C -50 -58, 30 -60, 80 -48" stroke="#fff" stroke-width="10" fill="none" opacity=".5" stroke-linecap="round"/></g>')

    def berries(cx=256, cy=256, s=1.0):
        rasp = "".join(f'<g transform="translate({x} {y})"><circle r="26" fill="#d6304a" stroke="{INK}" stroke-width="3"/>' + "".join(f'<circle cx="{8 * math.cos(a):.0f}" cy="{8 * math.sin(a):.0f}" r="6" fill="#ff6b83"/>' for a in [i * 1.05 for i in range(6)]) + "</g>" for x, y in [(-40, 0), (30, -10)])
        blue = "".join(f'<circle cx="{x}" cy="{y}" r="16" fill="#3b4f9e" stroke="{INK}" stroke-width="3"/>' for x, y in [(0, 20), (-10, -24), (52, 18)])
        return f'<g transform="translate({cx} {cy}) scale({s})">{rasp}{blue}{leaf(-10, -40, -70, .8)}</g>'

    def pancake(fill="url(#pancake)", cx=256, cy=256):
        return (f'<ellipse cx="{cx}" cy="{cy + 22}" rx="190" ry="60" fill="#000" opacity=".14"/>'
                f'<path d="M {cx - 190} {cy} C {cx - 190} {cy + 40}, {cx + 190} {cy + 40}, {cx + 190} {cy} L {cx + 190} {cy - 14} L {cx - 190} {cy - 14} Z" fill="#b8742c" stroke="{INK}" stroke-width="5"/>'
                f'<ellipse cx="{cx}" cy="{cy - 14}" rx="190" ry="58" fill="{fill}" stroke="{INK}" stroke-width="5"/>'
                + "".join(f'<circle cx="{cx + dx}" cy="{cy - 14 + dy}" r="5" fill="#c58035" opacity=".6"/>' for dx, dy in [(-80, -10), (40, 12), (100, -20), (-20, -30), (-120, 14)]))

    batter = f'<path d="M 90 260 C 80 200, 200 180, 260 186 C 360 190, 440 220, 420 270 C 400 320, 120 330, 90 260 Z" fill="url(#batter)" stroke="{INK}" stroke-width="5"/>' + f'<circle cx="200" cy="240" r="6" fill="#fff" opacity=".8"/><circle cx="320" cy="250" r="4" fill="#fff" opacity=".8"/>'
    butter = f'<g transform="translate(256 240)"><path d="M -60 -10 L 0 -40 L 60 -10 L 0 20 Z" fill="#fff3a8" stroke="{INK}" stroke-width="5"/><path d="M -60 -10 L 0 20 L 0 44 L -60 14 Z" fill="#f4dc70" stroke="{INK}" stroke-width="5"/><path d="M 0 20 L 60 -10 L 60 14 L 0 44 Z" fill="#e8cc5a" stroke="{INK}" stroke-width="5"/></g>'
    syrup = f'<path d="M 90 250 C 140 220, 200 280, 256 240 C 320 200, 380 280, 420 246 L 420 262 C 380 300, 320 230, 256 262 C 200 300, 140 246, 90 270 Z" fill="#b8661c" opacity=".85"/>' + "".join(f'<path d="M {x} 262 q 6 30 0 50" stroke="#b8661c" stroke-width="10" stroke-linecap="round" opacity=".85"/>' for x in (120, 250, 390))
    straw = "".join(f'<g transform="translate({x} {y}) rotate({r})"><path d="M -30 -20 C -30 30, 30 30, 30 -20 C 20 -34, -20 -34, -30 -20 Z" fill="#e8384f" stroke="{INK}" stroke-width="4"/><path d="M -18 -14 C -18 14, 18 14, 18 -14" fill="#ff8a9a"/>' + "".join(f'<circle cx="{dx}" cy="{dy}" r="2" fill="#ffe27a"/>' for dx, dy in [(-14, -6), (0, 4), (12, -8), (-4, -16)]) + "</g>" for x, y, r in [(200, 220, -20), (270, 205, 10), (320, 235, 30)])
    blue = "".join(f'<circle cx="{x}" cy="{y}" r="17" fill="#3b4f9e" stroke="{INK}" stroke-width="3"/><circle cx="{x - 5}" cy="{y - 5}" r="4" fill="#8fa2e0"/>' for x, y in [(200, 225), (236, 205), (270, 230), (306, 210), (330, 238), (250, 250)])

    for name, colour in [("macaron-pink", "#f7a8c4"), ("macaron-green", "#b8e0a0"), ("macaron-yellow", "#fbe08a")]:
        save(f"{name}.svg", macaron(colour, cx=256, cy=256, s=1.3))
    save("berries.svg", berries(256, 256, 1.8))
    save("batter.svg", batter)
    save("pancake.svg", pancake())
    save("butter.svg", butter)
    save("syrup.svg", syrup)
    save("strawberries.svg", straw)
    save("blueberries.svg", blue)
    tower = macaron("#f7a8c4", cx=256, cy=380, s=.95) + macaron("#b8e0a0", cx=256, cy=300, s=.95) + macaron("#fbe08a", cx=256, cy=220, s=.95) + berries(256, 150, 1.2)
    save("final-macaron-tower.svg", tower)
    stack = pancake(cy=330) + pancake(cy=280) + butter.replace("translate(256 240)", "translate(256 230) scale(.7)") + syrup
    save("final-pancakes-strawberry.svg", stack + straw)
    save("final-pancakes-blueberry.svg", stack + blue)

    # icons
    save("icons/macaron-pink.svg", macaron("#f7a8c4", s=1.4))
    save("icons/macaron-green.svg", macaron("#b8e0a0", s=1.4))
    save("icons/macaron-yellow.svg", macaron("#fbe08a", s=1.4))
    save("icons/berries.svg", berries(256, 280, 2.6))
    save("icons/batter.svg", bowl() + ell(CX, CY, 150, 90, "url(#batter)", "#d8c08a", 3) + f'<path d="M 330 250 L 450 110" stroke="#9a9a9a" stroke-width="12" stroke-linecap="round"/><ellipse cx="320" cy="262" rx="26" ry="40" fill="none" stroke="#9a9a9a" stroke-width="8" transform="rotate(40 320 262)"/>')
    save("icons/butter.svg", butter.replace("translate(256 240)", "translate(256 260) scale(2.6)"))
    save("icons/syrup.svg", f'<path d="M 200 160 L 312 160 L 330 420 C 320 440, 192 440, 182 420 Z" fill="#b8661c" stroke="{INK}" stroke-width="6" opacity=".95"/><rect x="226" y="100" width="60" height="64" rx="8" fill="#f2efe6" stroke="{INK}" stroke-width="5"/><rect x="196" y="260" width="120" height="80" rx="10" fill="#fff4dc" stroke="{INK}" stroke-width="4"/><text x="256" y="310" font-size="26" font-family="Georgia" text-anchor="middle" fill="#8a4a1a">Maple</text>')
    save("icons/strawberries.svg", f'<g transform="translate(-260 -230) scale(2)">{straw}</g>')
    save("icons/blueberries.svg", f'<g transform="translate(-260 -230) scale(2)">{blue}</g>')
    save("icons/pan.svg", f'<ellipse cx="226" cy="280" rx="170" ry="110" fill="#333" stroke="{INK}" stroke-width="6"/><ellipse cx="226" cy="276" rx="140" ry="86" fill="#4a4a4a"/><rect x="380" y="262" width="120" height="30" rx="14" fill="#6e4524" stroke="{INK}" stroke-width="5"/>'
         + f'<g transform="translate(226 250) scale(.5)">{pancake(cx=0, cy=0)}</g>')

    # scene
    save("plate.svg", f'<ellipse cx="256" cy="276" rx="244" ry="170" fill="#000" opacity=".18"/><ellipse cx="256" cy="262" rx="244" ry="170" fill="#fffdf8" stroke="{INK}" stroke-width="5"/><ellipse cx="256" cy="262" rx="226" ry="156" fill="none" stroke="#e0b84a" stroke-width="6"/><ellipse cx="256" cy="266" rx="170" ry="114" fill="#f6f1e6"/>')
    lace = "".join(f'<circle cx="{256 + 236 * math.cos(a):.0f}" cy="{256 + 236 * math.sin(a):.0f}" r="22" fill="#fffaf2" stroke="#e6dccb" stroke-width="3"/>' for a in [i * math.pi / 14 for i in range(28)])
    save("mat.svg", f'<g transform="translate(256 256) scale(1 .66) translate(-256 -256)">{lace}<circle cx="256" cy="256" r="236" fill="#fffaf2" stroke="#e6dccb" stroke-width="4"/>' + "".join(f'<circle cx="256" cy="256" r="{r}" fill="none" stroke="#efe5d4" stroke-width="3" stroke-dasharray="6 8"/>' for r in (200, 160, 120)) + "</g>")
    w, h = 1672, 941
    cakes = "".join(f'<g transform="translate({x} 330)"><rect x="-60" y="-50" width="120" height="70" rx="10" fill="{c}" stroke="{INK}" stroke-width="4"/><rect x="-60" y="-56" width="120" height="16" rx="8" fill="#fffaf2"/><circle cx="0" cy="-66" r="12" fill="#e8384f"/></g>' for x, c in [(200, "#f7a8c4"), (360, "#c8a27a"), (1300, "#b8e0a0"), (1460, "#fbe08a")])
    body = (f'<rect width="{w}" height="{h}" fill="#bfe3d6"/>' + "".join(f'<rect x="{x}" y="0" width="40" height="560" fill="#d4ede4"/>' for x in range(0, w, 80))
            + f'<rect y="380" width="{w}" height="180" fill="#f7e9ee"/>' + "".join(f'<rect x="{x}" y="380" width="6" height="180" fill="#e8cfd8"/>' for x in range(0, w, 60))
            + "".join(f'<g><rect x="{x}" y="120" width="230" height="250" rx="115" fill="url(#skyc)" stroke="#fff" stroke-width="14"/><path d="M {x - 20} 120 L {x + 250} 120 L {x + 230} 80 L {x} 80 Z" fill="#f29ab4"/>' + "".join(f'<rect x="{x - 20 + i * 54}" y="80" width="27" height="40" fill="#fffaf2"/>' for i in range(5)) + "</g>" for x in (560, 880))
            + f'<rect x="120" y="270" width="320" height="16" fill="#fffaf2"/><rect x="1220" y="270" width="320" height="16" fill="#fffaf2"/>' + cakes
            + f'<g transform="translate(836 40)"><line x1="0" y1="-40" x2="0" y2="20" stroke="#c9a24a" stroke-width="4"/>' + "".join(f'<circle cx="{dx}" cy="{30 + abs(dx) / 6:.0f}" r="10" fill="#fff6c8"/><circle cx="{dx}" cy="{30 + abs(dx) / 6:.0f}" r="26" fill="#fff6c8" opacity=".3"/>' for dx in (-90, -45, 0, 45, 90)) + "</g>"
            + f'<text x="836" y="430" font-family="Georgia, serif" font-size="56" font-style="italic" fill="#b0577a" text-anchor="middle">Lumière Café</text>'
            + f'<rect y="560" width="{w}" height="{h - 560}" fill="url(#marble)"/><rect y="556" width="{w}" height="8" fill="#e0b84a"/>')
    save("dining.svg", body, w, h, '<linearGradient id="skyc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfe0ff"/><stop offset="1" stop-color="#ffe2ec"/></linearGradient><linearGradient id="marble" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8f4"/><stop offset="1" stop-color="#e6e0d8"/></linearGradient>')
    veins = "".join(f'<path d="M {x} 220 C {x + 120} 400, {x - 60} 600, {x + 80} 941" stroke="#d8d0c6" stroke-width="3" fill="none"/>' for x in range(100, w, 260))
    save("counter.svg", f'<rect width="{w}" height="{h}" fill="url(#marble)"/>' + veins + f'<rect width="{w}" height="200" fill="#f2c9d6"/><rect y="196" width="{w}" height="10" fill="#e0b84a"/>'
         + "".join(ell(300 + i * 180, 118, 70, 42, "#fffdf8") + ell(300 + i * 180, 116, 52, 28, c, "none", 0) for i, c in enumerate(["#f7a8c4", "#b8e0a0", "#fbe08a", "#e8384f", "#3b4f9e", "#fff4d6", "#b8661c"]))
         + f'<g transform="translate(1480 640)"><ellipse rx="130" ry="80" fill="#fffdf8" stroke="{INK}" stroke-width="5"/><rect x="-14" y="-10" width="28" height="90" fill="#e6e0d8" stroke="{INK}" stroke-width="4"/></g>'
         + "".join(f'<circle cx="{220 + dx}" cy="{700 + dy}" r="26" fill="{c}" stroke="{INK}" stroke-width="3"/>' for dx, dy, c in [(0, 0, "#f29ab4"), (40, 30, "#fbe08a"), (-30, 40, "#f7a8c4")]) + leaf(170, 760, 200, 1.4),
         w, h, '<linearGradient id="marble" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbf8f4"/><stop offset="1" stop-color="#e6e0d8"/></linearGradient>')


# =============================================================== DINER (Route 66)

def diner():
    save = saver("diner")

    def bun_bottom():
        return f'<path d="M 90 250 L 422 250 C 422 300, 380 320, 256 320 C 132 320, 90 300, 90 250 Z" fill="url(#bun)" stroke="{INK}" stroke-width="5"/><ellipse cx="256" cy="250" rx="166" ry="34" fill="#f8deb0" stroke="{INK}" stroke-width="5"/>'

    def bun_top():
        seeds = "".join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="4" fill="#fff6dc" transform="rotate({(x * 7) % 60 - 30} {x} {y})"/>' for x, y in [(180, 190), (230, 170), (290, 175), (340, 195), (210, 215), (300, 210), (256, 195)])
        return f'<path d="M 86 260 C 86 140, 426 140, 426 260 C 426 280, 86 280, 86 260 Z" fill="url(#bun)" stroke="{INK}" stroke-width="5"/>' + seeds + f'<path d="M 140 200 C 170 170, 220 160, 260 160" stroke="#fff" stroke-width="10" fill="none" opacity=".4" stroke-linecap="round"/>'

    def patty(raw=False):
        fill = "url(#pattyRaw)" if raw else "url(#patty)"
        marks = "" if raw else "".join(f'<path d="M {x} 236 L {x + 60} 268" stroke="#2a1608" stroke-width="7" opacity=".6"/>' for x in (150, 220, 290))
        return f'<path d="M 96 250 C 96 290, 416 290, 416 250 L 416 236 L 96 236 Z" fill="{"#a85060" if raw else "#3a1e0c"}" stroke="{INK}" stroke-width="5"/><ellipse cx="256" cy="238" rx="160" ry="40" fill="{fill}" stroke="{INK}" stroke-width="5"/>' + marks

    cheese = f'<path d="M 100 240 L 412 240 L 420 262 L 360 262 L 352 300 L 330 262 L 190 262 L 176 296 L 160 262 L 92 262 Z" fill="#ffc83d" stroke="{INK}" stroke-width="4"/><path d="M 120 240 L 392 240 L 380 226 L 132 226 Z" fill="#ffd96b" stroke="{INK}" stroke-width="4"/>'
    lettuce = f'<path d="M 80 250 ' + " ".join(f"Q {100 + i * 40} {226 + (i % 2) * 40} {120 + i * 40} 250" for i in range(8)) + f' L 420 262 C 330 290, 180 290, 80 262 Z" fill="#7cc24a" stroke="{INK}" stroke-width="4"/>'
    tomato = "".join(f'<g transform="translate({x} 248)"><ellipse rx="82" ry="22" fill="#e8402e" stroke="{INK}" stroke-width="4"/><ellipse rx="58" ry="14" fill="#ff7a5c"/>' + "".join(f'<ellipse cx="{dx}" cy="0" rx="8" ry="4" fill="#ffd2a0"/>' for dx in (-30, 0, 30)) + "</g>" for x in (180, 332))
    save("bun-bottom.svg", bun_bottom())
    save("bun-top.svg", bun_top())
    save("patty-raw.svg", patty(True))
    save("patty.svg", patty())
    save("cheese.svg", cheese)
    save("lettuce.svg", lettuce)
    save("tomato.svg", tomato)

    def burger(with_lettuce=True):
        def at(body, dy):
            return f'<g transform="translate(0 {dy})">{body}</g>'
        parts = at(bun_bottom(), 120) + at(patty(), 80) + at(cheese, 60)
        if with_lettuce:
            parts += at(lettuce, 40)
        parts += at(tomato, 26 if with_lettuce else 40) + at(bun_top(), -10 if with_lettuce else 4)
        return f'<g transform="translate(26 0) scale(.9)">{parts}</g>'
    save("final-cheeseburger.svg", burger(True))
    save("final-cheeseburger-no-lettuce.svg", burger(False))

    potato = f'<g transform="translate(256 256)"><path d="M -110 0 C -120 -60, 80 -80, 110 -20 C 130 30, 40 70, -40 60 C -90 54, -104 30, -110 0 Z" fill="#c8995a" stroke="{INK}" stroke-width="5"/>' + "".join(f'<ellipse cx="{x}" cy="{y}" rx="7" ry="4" fill="#8a6030"/>' for x, y in [(-60, -10), (10, -40), (60, 10), (-20, 30)]) + "</g>"
    rnd = random.Random(61)

    def sticks(fill, edge, n=26):
        out = ""
        for i in range(n):
            x, y, r = 256 + rnd.uniform(-120, 120), 250 + rnd.uniform(-50, 50), rnd.uniform(-60, 60)
            out += f'<rect x="{x - 9:.0f}" y="{y - 60:.0f}" width="18" height="120" rx="5" fill="{fill}" stroke="{edge}" stroke-width="3" transform="rotate({r:.0f} {x:.0f} {y:.0f})"/>'
        return out
    salt = sprinkle(62, 60, "#ffffff", rx=200, ry=90, size=(3, 5), dy=-10, stroke="#cfcfcf")
    basket = f'<path d="M 120 220 L 392 220 L 360 370 L 152 370 Z" fill="#fbf6ec" stroke="{INK}" stroke-width="5"/>' + "".join(f'<rect x="{150 + i * 40}" y="300" width="20" height="70" fill="#d42a1c" opacity=".8"/>' for i in range(6))
    fries_in_basket = "".join(f'<rect x="{x}" y="{y}" width="20" height="130" rx="5" fill="url(#fries)" stroke="#b07a1c" stroke-width="3" transform="rotate({r} {x + 10} {y + 65})"/>' for x, y, r in [(150, 120, -18), (180, 100, -8), (210, 110, 4), (240, 90, -3), (270, 105, 10), (300, 100, 16), (330, 120, 22), (200, 140, 12), (280, 140, -12)])
    save("potato.svg", potato)
    peeled = f'<g transform="translate(256 256)"><path d="M -110 0 C -120 -60, 80 -80, 110 -20 C 130 30, 40 70, -40 60 C -90 54, -104 30, -110 0 Z" fill="#f6e3a6" stroke="{INK}" stroke-width="5"/><path d="M -70 -30 C -30 -50, 30 -55, 70 -35" stroke="#fff8dc" stroke-width="10" fill="none" stroke-linecap="round"/><ellipse cx="60" cy="10" rx="6" ry="3" fill="#d9bf73"/></g>'
    save("potato-peeled.svg", peeled)
    rnd = random.Random(61)
    save("potato-sticks.svg", sticks("#f4e2b0", "#c8a86a"))
    rnd = random.Random(61)
    save("fries.svg", sticks("url(#fries)", "#b07a1c"))
    save("salt.svg", salt)
    save("final-fries.svg", fries_in_basket + basket + salt)
    save("final-fries-no-salt.svg", fries_in_basket + basket)

    # icons
    save("icons/bun-bottom.svg", f'<g transform="translate(0 20)">{bun_bottom()}</g>')
    save("icons/bun-top.svg", f'<g transform="translate(0 40)">{bun_top()}</g>')
    save("icons/patty.svg", f'<g transform="translate(0 20)">{patty(True)}</g>')
    save("icons/cheese.svg", f'<path d="M 120 360 L 400 360 L 400 200 L 120 160 Z" fill="#ffc83d" stroke="{INK}" stroke-width="6"/>' + "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e8a820"/>' for x, y, r in [(200, 260, 16), (300, 300, 12), (330, 230, 9)]))
    save("icons/lettuce.svg", f'<g transform="translate(-130 -170) scale(1.5)">{lettuce}</g>')
    save("icons/tomato.svg", f'<circle cx="256" cy="280" r="130" fill="#e8402e" stroke="{INK}" stroke-width="6"/><path d="M 210 160 L 256 180 L 300 160 L 280 190 L 256 186 L 230 190 Z" fill="#3f9a3c" stroke="{INK}" stroke-width="4"/><path d="M 180 230 C 200 200, 230 190, 260 190" stroke="#fff" stroke-width="12" fill="none" opacity=".5" stroke-linecap="round"/>')
    save("icons/potato.svg", f'<g transform="translate(-256 -256) scale(2)">{potato}</g>')
    save("icons/salt.svg", f'<path d="M 190 200 L 322 200 L 340 420 L 172 420 Z" fill="#f2f6f8" stroke="{INK}" stroke-width="6"/><path d="M 190 200 C 190 130, 322 130, 322 200 Z" fill="#b8c2c8" stroke="{INK}" stroke-width="6"/>' + "".join(f'<circle cx="{x}" cy="160" r="6" fill="{INK}"/>' for x in (230, 256, 282)))
    save("icons/peeler.svg", f'<g transform="rotate(-35 256 256)"><rect x="226" y="250" width="60" height="200" rx="24" fill="#2fb5a8" stroke="{INK}" stroke-width="6"/><path d="M 226 260 L 210 90 C 230 60, 282 60, 302 90 L 286 260 Z" fill="#dfe6ea" stroke="{INK}" stroke-width="6"/><path d="M 236 110 L 276 110 L 268 230 L 244 230 Z" fill="#9aa6b0"/></g>'
         + f'<path d="M 330 380 C 380 360, 420 380, 440 420" stroke="#c8995a" stroke-width="14" fill="none" stroke-linecap="round"/>')
    save("icons/season.svg", f'<path d="M 120 220 L 230 220 L 244 420 L 106 420 Z" fill="#f2f6f8" stroke="{INK}" stroke-width="6"/><path d="M 120 220 C 120 160, 230 160, 230 220 Z" fill="#b8c2c8" stroke="{INK}" stroke-width="6"/>'
         + "".join(f'<circle cx="{x}" cy="190" r="6" fill="{INK}"/>' for x in (155, 175, 195))
         + f'<path d="M 282 220 L 392 220 L 406 420 L 268 420 Z" fill="#3a3a3a" stroke="{INK}" stroke-width="6"/><path d="M 282 220 C 282 160, 392 160, 392 220 Z" fill="#8a8a8a" stroke="{INK}" stroke-width="6"/>'
         + "".join(f'<circle cx="{x}" cy="190" r="6" fill="#fff"/>' for x in (317, 337, 357))
         + f'<text x="175" y="340" font-family="Arial Black, Arial" font-size="70" text-anchor="middle" fill="{INK}">S</text><text x="337" y="340" font-family="Arial Black, Arial" font-size="70" text-anchor="middle" fill="#fff">P</text>')
    save("patty-seasoned.svg", patty(True) + sprinkle(71, 40, "#2a2a2a", rx=230, ry=50, size=(3, 5), dy=-32) + sprinkle(72, 30, "#ffffff", rx=230, ry=50, size=(3, 5), dy=-32))
    save("icons/grill.svg", f'<rect x="80" y="220" width="352" height="180" rx="20" fill="#2b2b2b" stroke="{INK}" stroke-width="6"/>' + "".join(f'<line x1="{x}" y1="230" x2="{x}" y2="390" stroke="#666" stroke-width="8"/>' for x in range(110, 420, 40)) + f'<g transform="translate(0 30) scale(1)">{patty()}</g>'
         + "".join(f'<path d="M {x} 200 C {x - 20} 160, {x + 20} 140, {x} 100" stroke="#cfd8df" stroke-width="10" fill="none" stroke-linecap="round" opacity=".7"/>' for x in (200, 256, 312)))
    save("icons/fryer.svg", f'<rect x="100" y="220" width="312" height="200" rx="16" fill="#9aa6b0" stroke="{INK}" stroke-width="6"/><rect x="130" y="190" width="252" height="60" rx="10" fill="#e3a531" stroke="{INK}" stroke-width="5"/>'
         + "".join(f'<circle cx="{x}" cy="{y}" r="9" fill="#ffd970" stroke="#b07a1c" stroke-width="2"/>' for x, y in [(170, 210), (220, 225), (270, 205), (320, 222), (350, 206)]) + f'<rect x="380" y="150" width="90" height="24" rx="10" fill="#333" stroke="{INK}" stroke-width="5"/>')

    # scene
    save("plate.svg", f'<ellipse cx="256" cy="276" rx="244" ry="170" fill="#000" opacity=".18"/><ellipse cx="256" cy="262" rx="244" ry="170" fill="#fffdf8" stroke="{INK}" stroke-width="5"/><ellipse cx="256" cy="262" rx="226" ry="156" fill="none" stroke="#d42a1c" stroke-width="10"/><ellipse cx="256" cy="266" rx="176" ry="118" fill="#f4f1ea"/>')
    cells = "".join(f'<rect x="{c * 64}" y="{r * 64}" width="64" height="64" fill="#d42a1c"/>' for r in range(8) for c in range(8) if (r + c) % 2 == 0)
    save("mat.svg", f'<g transform="translate(256 256) scale(1 .62) translate(-256 -256)"><rect width="512" height="512" fill="#fffaf2"/>{cells}<rect width="512" height="512" fill="none" stroke="#8f1d10" stroke-width="10"/></g>')
    w, h = 1672, 941
    booths = "".join(f'<rect x="{x}" y="400" width="240" height="160" rx="30" fill="#d42a1c" stroke="#7a1410" stroke-width="8"/><rect x="{x + 20}" y="420" width="200" height="40" rx="14" fill="#ff5a4a"/>' for x in (80, 1350))
    body = (f'<rect width="{w}" height="{h}" fill="#2fb5a8"/>' + f'<rect y="360" width="{w}" height="200" fill="#fffaf2"/>' + "".join(f'<rect x="{x}" y="360" width="50" height="200" fill="#1d1d1d"/>' for x in range(0, w, 100))
            + f'<rect y="350" width="{w}" height="14" fill="#c0c8cc"/>' + booths
            + f'<g transform="translate(836 180)"><rect x="-270" y="-110" width="540" height="200" rx="30" fill="#1a1a2e" stroke="#ff4fa0" stroke-width="10"/><text x="0" y="-10" font-family="Arial Black, Arial, sans-serif" font-size="80" fill="#ff4fa0" text-anchor="middle">ROUTE 66</text><text x="0" y="60" font-family="Arial, sans-serif" font-size="36" fill="#7ef0ff" text-anchor="middle">DINER · BURGERS · FRIES</text></g>'
            + f'<g transform="translate(330 260)"><rect x="-70" y="-120" width="140" height="240" rx="60" fill="#e8a820" stroke="#7a4a10" stroke-width="8"/><rect x="-50" y="-60" width="100" height="80" rx="10" fill="#7ef0ff"/></g>'
            + f'<g transform="translate(1340 230)"><circle r="70" fill="#fffaf2" stroke="#c0c8cc" stroke-width="10"/><line x1="0" y1="0" x2="0" y2="-44" stroke="#222" stroke-width="6"/><line x1="0" y1="0" x2="30" y2="10" stroke="#222" stroke-width="6"/></g>'
            + f'<rect y="560" width="{w}" height="{h - 560}" fill="url(#steelc)"/><rect y="556" width="{w}" height="10" fill="#d42a1c"/>')
    save("dining.svg", body, w, h, '<linearGradient id="steelc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3e8eb"/><stop offset="1" stop-color="#aab4ba"/></linearGradient>')
    save("counter.svg", f'<rect width="{w}" height="{h}" fill="url(#steelc)"/>' + "".join(f'<rect y="{y}" width="{w}" height="2" fill="#fff" opacity=".4"/>' for y in range(240, h, 90))
         + f'<rect width="{w}" height="200" fill="#1d1d1d"/>' + "".join(f'<rect x="{x}" y="0" width="40" height="200" fill="#fffaf2"/>' for x in range(0, w, 80)) + f'<rect y="196" width="{w}" height="10" fill="#d42a1c"/>'
         + f'<g transform="translate(1480 560)"><rect x="-30" y="-120" width="60" height="200" rx="20" fill="#d42a1c" stroke="{INK}" stroke-width="5"/><rect x="50" y="-120" width="60" height="200" rx="20" fill="#ffc83d" stroke="{INK}" stroke-width="5"/></g>'
         + f'<g transform="translate(220 680)"><rect x="-120" y="-60" width="240" height="120" rx="20" fill="#2b2b2b"/>' + "".join(f'<line x1="{x}" y1="-50" x2="{x}" y2="50" stroke="#666" stroke-width="6"/>' for x in range(-100, 110, 30)) + "</g>",
         w, h, '<linearGradient id="steelc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e3e8eb"/><stop offset="1" stop-color="#aab4ba"/></linearGradient>')


if __name__ == "__main__":
    thai()
    cafe()
    diner()
    print("wrote thai/, cafe/ and diner/ mockups to", os.path.normpath(ROOT))
