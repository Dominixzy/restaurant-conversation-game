"""Mockup art for Bella Trattoria (r2), written as SVG into public/assets/food/italian/.

These are placeholders until real art exists. Plate layers share one 512x512 canvas centred on
(256, 270), so a topping drawn here lines up with the pizza underneath it on the plate.

Run:  python3 scripts/italian_mockups.py
"""
import math
import os
import random

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets", "food", "italian")
INK = "#4A2A14"  # outline colour used by the existing sushi art
CX, CY = 256, 270  # centre of the pizza / bowl on every plate layer
RX, RY = 222, 154  # pizza size, squashed to match the plate's perspective


def svg(body, w=512, h=512, defs=""):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}"><defs>{defs}</defs>{body}</svg>\n'


def save(name, content):
    path = os.path.join(OUT, name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)


def scatter(seed, count, rx, ry, min_gap):
    """Deterministic spots inside an ellipse, kept apart so toppings don't pile up."""
    rnd = random.Random(seed)
    spots = []
    while len(spots) < count:
        a, r = rnd.uniform(0, 2 * math.pi), math.sqrt(rnd.uniform(0, 1))
        x, y = CX + math.cos(a) * r * rx, CY + math.sin(a) * r * ry
        if all(math.hypot(x - sx, (y - sy) * 1.4) > min_gap for sx, sy in spots):
            spots.append((x, y))
    return spots


# --- shared pieces -------------------------------------------------------------------------

GRADS = """
<radialGradient id="dough" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#f8e6bf"/><stop offset="1" stop-color="#e6c48a"/></radialGradient>
<radialGradient id="crustBaked" cx="45%" cy="40%" r="70%"><stop offset="0" stop-color="#eab36a"/><stop offset="1" stop-color="#c47a35"/></radialGradient>
<radialGradient id="sauce" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#e8502f"/><stop offset="1" stop-color="#b52a18"/></radialGradient>
<radialGradient id="sauceBaked" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#d4462a"/><stop offset="1" stop-color="#9c2414"/></radialGradient>
<radialGradient id="cheese" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#efe3c6"/></radialGradient>
<radialGradient id="cheeseBaked" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff3cf"/><stop offset="1" stop-color="#f1c76d"/></radialGradient>
<radialGradient id="bowl" cx="45%" cy="35%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#dcd6cc"/></radialGradient>
<linearGradient id="pasta" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7dc8a"/><stop offset="1" stop-color="#e2b955"/></linearGradient>
<linearGradient id="wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9a066"/><stop offset="1" stop-color="#b47740"/></linearGradient>
"""


def dough(baked=False):
    fill = "url(#crustBaked)" if baked else "url(#dough)"
    inner = "#e8b56c" if baked else "#f6e3bc"
    out = f'<ellipse cx="{CX}" cy="{CY + 8}" rx="{RX}" ry="{RY}" fill="#000" opacity=".18"/>'
    out += f'<ellipse cx="{CX}" cy="{CY}" rx="{RX}" ry="{RY}" fill="{fill}" stroke="{INK}" stroke-width="5"/>'
    out += f'<ellipse cx="{CX}" cy="{CY + 4}" rx="{RX - 26}" ry="{RY - 20}" fill="{inner}" opacity=".9"/>'
    if baked:
        for x, y in scatter(11, 14, RX - 8, RY - 6, 30):
            if ((x - CX) / (RX - 30)) ** 2 + ((y - CY) / (RY - 22)) ** 2 > 1:
                out += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="7" ry="4" fill="#7a3f14" opacity=".55"/>'
    else:
        for x, y in scatter(3, 24, RX - 20, RY - 16, 22):
            out += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="2.5" fill="#fff" opacity=".7"/>'
    return out


def sauce_on_pizza(baked=False):
    fill = "url(#sauceBaked)" if baked else "url(#sauce)"
    out = f'<ellipse cx="{CX}" cy="{CY + 4}" rx="{RX - 34}" ry="{RY - 28}" fill="{fill}"/>'
    for x, y in scatter(5, 18, RX - 50, RY - 40, 26):
        out += f'<circle cx="{x:.0f}" cy="{y:.0f}" r="4" fill="#8f1d10" opacity=".45"/>'
    return out


def mozzarella(baked=False):
    out = ""
    fill = "url(#cheeseBaked)" if baked else "url(#cheese)"
    for i, (x, y) in enumerate(scatter(7, 9, RX - 70, RY - 55, 62)):
        rx, ry = (40, 27) if baked else (30, 20)
        out += f'<ellipse cx="{x:.0f}" cy="{y + 3:.0f}" rx="{rx}" ry="{ry}" fill="#000" opacity=".12"/>'
        out += f'<ellipse cx="{x:.0f}" cy="{y:.0f}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{INK}" stroke-width="2" stroke-opacity=".35" transform="rotate({(i * 37) % 60 - 30} {x:.0f} {y:.0f})"/>'
        if baked:
            out += f'<ellipse cx="{x + 8:.0f}" cy="{y - 4:.0f}" rx="9" ry="5" fill="#e0a645" opacity=".55"/>'
    return out


def leaf(x, y, angle, size=1.0):
    return (
        f'<g transform="translate({x:.0f} {y:.0f}) rotate({angle}) scale({size})">'
        f'<path d="M0 0 C 18 -22, 52 -20, 64 0 C 52 20, 18 22, 0 0 Z" fill="#3f9a3c" stroke="{INK}" stroke-width="3"/>'
        f'<path d="M4 0 L 58 0" stroke="#2c6e2a" stroke-width="3"/>'
        f'<path d="M6 -6 C 20 -14, 36 -14, 50 -8" stroke="#8fd28a" stroke-width="3" fill="none" opacity=".6"/></g>'
    )


def basil():
    # A few leaves near the middle, so the same layer works on a pizza and on a bowl of pasta.
    return leaf(CX - 60, CY - 20, -20) + leaf(CX + 6, CY + 18, 200, 0.9) + leaf(CX + 10, CY - 34, -60, 0.85)


def mushrooms(baked=False):
    cap, stem = ("#a3683a", "#e8cfa6") if baked else ("#c49a6c", "#f4e6cc")
    out = ""
    for i, (x, y) in enumerate(scatter(9, 8, RX - 70, RY - 55, 64)):
        rot = (i * 53) % 80 - 40
        out += (
            f'<g transform="translate({x:.0f} {y:.0f}) rotate({rot})">'
            f'<path d="M-26 2 C -26 -24, 26 -24, 26 2 Z" fill="{cap}" stroke="{INK}" stroke-width="2.5"/>'
            f'<path d="M-9 2 L -8 22 C -4 26, 4 26, 8 22 L 9 2 Z" fill="{stem}" stroke="{INK}" stroke-width="2.5"/>'
            f'<path d="M-20 0 C -14 -14, 14 -14, 20 0" stroke="{stem}" stroke-width="4" fill="none" opacity=".7"/></g>'
        )
    return out


def cut_lines():
    out = ""
    for k in range(4):
        a = math.pi * k / 4
        dx, dy = math.cos(a) * (RX - 6), math.sin(a) * (RY - 4)
        out += f'<line x1="{CX - dx:.0f}" y1="{CY - dy:.0f}" x2="{CX + dx:.0f}" y2="{CY + dy:.0f}" stroke="#5a2a0c" stroke-width="5" opacity=".55"/>'
        out += f'<line x1="{CX - dx:.0f}" y1="{CY - dy - 2:.0f}" x2="{CX + dx:.0f}" y2="{CY + dy - 2:.0f}" stroke="#fff3d6" stroke-width="1.5" opacity=".5"/>'
    return out


def bowl():
    out = f'<ellipse cx="{CX}" cy="{CY + 14}" rx="210" ry="138" fill="#000" opacity=".18"/>'
    out += f'<ellipse cx="{CX}" cy="{CY}" rx="210" ry="138" fill="url(#bowl)" stroke="{INK}" stroke-width="5"/>'
    out += f'<ellipse cx="{CX}" cy="{CY + 6}" rx="160" ry="100" fill="#efe9de" stroke="#cfc6b8" stroke-width="3"/>'
    out += f'<path d="M {CX - 180} {CY - 40} C {CX - 120} {CY - 120}, {CX + 40} {CY - 130}, {CX + 120} {CY - 105}" stroke="#fff" stroke-width="8" fill="none" opacity=".7"/>'
    return out


def spaghetti():
    rnd = random.Random(21)
    out = f'<ellipse cx="{CX}" cy="{CY + 10}" rx="140" ry="82" fill="#d9ae4c"/>'
    for i in range(46):
        a = rnd.uniform(0, 2 * math.pi)
        r = rnd.uniform(20, 120)
        x0, y0 = CX + math.cos(a) * r, CY + 6 + math.sin(a) * r * 0.6
        a2 = a + rnd.uniform(1.2, 2.6)
        r2 = rnd.uniform(20, 125)
        x1, y1 = CX + math.cos(a2) * r2, CY + 6 + math.sin(a2) * r2 * 0.6
        mx, my = (x0 + x1) / 2 + rnd.uniform(-40, 40), (y0 + y1) / 2 + rnd.uniform(-40, 10)
        out += f'<path d="M {x0:.0f} {y0:.0f} Q {mx:.0f} {my:.0f} {x1:.0f} {y1:.0f}" stroke="#b8862c" stroke-width="7" fill="none" stroke-linecap="round"/>'
        out += f'<path d="M {x0:.0f} {y0:.0f} Q {mx:.0f} {my:.0f} {x1:.0f} {y1:.0f}" stroke="url(#pasta)" stroke-width="4.5" fill="none" stroke-linecap="round"/>'
    return out


def sauce_on_pasta():
    out = (
        f'<path d="M {CX - 82} {CY - 6} C {CX - 90} {CY - 56}, {CX - 20} {CY - 74}, {CX + 30} {CY - 60} '
        f'C {CX + 92} {CY - 48}, {CX + 96} {CY + 6}, {CX + 52} {CY + 24} C {CX + 10} {CY + 40}, {CX - 70} {CY + 34}, {CX - 82} {CY - 6} Z" '
        f'fill="url(#sauce)" stroke="{INK}" stroke-width="3" stroke-opacity=".5"/>'
    )
    for x, y in [(CX - 30, CY - 30), (CX + 24, CY - 18), (CX - 6, CY + 8), (CX + 50, CY - 40)]:
        out += f'<circle cx="{x}" cy="{y}" r="9" fill="#d43d24" stroke="#8f1d10" stroke-width="2"/>'
    return out


def parmesan():
    rnd = random.Random(31)
    out = ""
    for _ in range(70):
        x, y = CX + rnd.gauss(0, 40), CY - 20 + rnd.gauss(0, 22)
        out += f'<rect x="{x:.0f}" y="{y:.0f}" width="{rnd.uniform(5, 10):.0f}" height="3" rx="1.5" fill="#fbf3d5" stroke="#d8c48a" stroke-width="1" transform="rotate({rnd.uniform(-60, 60):.0f} {x:.0f} {y:.0f})"/>'
    return out


def sauce_puddle():
    return (
        f'<path d="M {CX - 90} {CY} C {CX - 96} {CY - 50}, {CX - 10} {CY - 70}, {CX + 40} {CY - 56} '
        f'C {CX + 100} {CY - 40}, {CX + 104} {CY + 20}, {CX + 50} {CY + 40} C {CX} {CY + 56}, {CX - 84} {CY + 44}, {CX - 90} {CY} Z" '
        f'fill="url(#sauce)" stroke="{INK}" stroke-width="4"/>'
    )


def dough_ball():
    """Unstretched dough sitting in the middle of the plate, before Stretch."""
    return (
        f'<ellipse cx="{CX}" cy="{CY + 34}" rx="96" ry="30" fill="#000" opacity=".18"/>'
        f'<path d="M {CX - 92} {CY + 30} C {CX - 100} {CY - 40}, {CX - 40} {CY - 72}, {CX} {CY - 72} '
        f'C {CX + 52} {CY - 72}, {CX + 104} {CY - 36}, {CX + 92} {CY + 30} C {CX + 70} {CY + 52}, {CX - 70} {CY + 52}, {CX - 92} {CY + 30} Z" '
        f'fill="url(#dough)" stroke="{INK}" stroke-width="5"/>'
        f'<path d="M {CX - 50} {CY - 36} C {CX - 30} {CY - 54}, {CX} {CY - 58}, {CX + 22} {CY - 54}" stroke="#fff" stroke-width="9" fill="none" opacity=".6" stroke-linecap="round"/>'
    )


def dry_spaghetti():
    """A bundle of dry spaghetti lying on the plate, before Boil."""
    sticks = "".join(
        f'<line x1="{CX - 150 + i * 2}" y1="{CY - 40 + i * 6}" x2="{CX + 150 + i * 2}" y2="{CY - 70 + i * 6}" stroke="#c99a3c" stroke-width="7" stroke-linecap="round"/>'
        f'<line x1="{CX - 150 + i * 2}" y1="{CY - 40 + i * 6}" x2="{CX + 150 + i * 2}" y2="{CY - 70 + i * 6}" stroke="#f0d27a" stroke-width="4" stroke-linecap="round"/>'
        for i in range(14))
    return f'<ellipse cx="{CX}" cy="{CY + 30}" rx="160" ry="26" fill="#000" opacity=".15"/>' + sticks + f'<rect x="{CX - 20}" y="{CY - 72}" width="36" height="104" rx="6" fill="#c0392b" stroke="{INK}" stroke-width="4" transform="rotate(-6 {CX} {CY})"/>'


# --- plate layers, composites and finished dishes -----------------------------------------

def layers():
    layer = lambda body: svg(body, defs=GRADS)
    save("dough.svg", layer(dough()))
    save("sauce-puddle.svg", layer(sauce_puddle()))
    save("pizza-sauced.svg", layer(dough() + sauce_on_pizza()))
    save("mozzarella.svg", layer(mozzarella()))
    save("basil.svg", layer(basil()))
    save("mushroom.svg", layer(mushrooms()))
    save("parmesan.svg", layer(parmesan()))
    save("spaghetti.svg", layer(bowl() + spaghetti()))
    save("dough-ball.svg", layer(dough_ball()))
    save("spaghetti-dry.svg", layer(dry_spaghetti()))
    save("pasta-sauced.svg", layer(bowl() + spaghetti() + sauce_on_pasta()))

    margherita = dough(True) + sauce_on_pizza(True) + mozzarella(True) + basil()
    funghi = dough(True) + sauce_on_pizza(True) + mozzarella(True) + mushrooms(True)
    save("pizza-margherita.svg", layer(margherita))
    save("pizza-margherita-cut.svg", layer(margherita + cut_lines()))
    save("pizza-funghi.svg", layer(funghi))
    save("pizza-funghi-cut.svg", layer(funghi + cut_lines()))
    save("spaghetti-pomodoro.svg", layer(bowl() + spaghetti() + sauce_on_pasta() + basil()))
    save("spaghetti-parmesan.svg", layer(bowl() + spaghetti() + sauce_on_pasta() + parmesan() + basil()))


# --- ingredient bin icons ------------------------------------------------------------------

def icons():
    icon = lambda body: svg(body, defs=GRADS)
    save("icons/dough.svg", icon(
        f'<ellipse cx="256" cy="330" rx="150" ry="40" fill="#000" opacity=".15"/>'
        f'<path d="M 110 320 C 100 200, 200 140, 256 140 C 330 140, 420 200, 400 320 C 380 360, 140 360, 110 320 Z" fill="url(#dough)" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 170 200 C 200 170, 250 165, 290 175" stroke="#fff" stroke-width="10" fill="none" opacity=".6" stroke-linecap="round"/>'))
    save("icons/sauce.svg", icon(
        f'<ellipse cx="256" cy="300" rx="170" ry="110" fill="url(#bowl)" stroke="{INK}" stroke-width="6"/>'
        f'<ellipse cx="256" cy="280" rx="135" ry="72" fill="url(#sauce)" stroke="#8f1d10" stroke-width="3"/>'
        f'<path d="M 390 250 L 470 150" stroke="#9a9a9a" stroke-width="16" stroke-linecap="round"/>'
        f'<circle cx="220" cy="265" r="12" fill="#f06a47" opacity=".7"/>'))
    save("icons/mozzarella.svg", icon(
        f'<circle cx="200" cy="290" r="95" fill="url(#cheese)" stroke="{INK}" stroke-width="6"/>'
        f'<circle cx="320" cy="250" r="80" fill="url(#cheese)" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 160 240 C 175 220, 200 215, 220 220" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round"/>'))
    save("icons/basil.svg", icon(
        f'<path d="M 256 440 C 250 360, 256 260, 262 150" stroke="#2c6e2a" stroke-width="10" fill="none"/>'
        + leaf(256, 200, -150, 2.2) + leaf(262, 260, -30, 2.2) + leaf(256, 330, -160, 2.0)))
    save("icons/mushroom.svg", icon(
        f'<path d="M 120 260 C 120 130, 392 130, 392 260 Z" fill="#c49a6c" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 210 260 L 200 400 C 220 420, 292 420, 312 400 L 302 260 Z" fill="#f4e6cc" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 170 200 C 200 175, 240 168, 270 172" stroke="#e8c79e" stroke-width="12" fill="none" stroke-linecap="round"/>'))
    save("icons/spaghetti.svg", icon(
        "".join(f'<line x1="{150 + i * 9}" y1="120" x2="{190 + i * 7}" y2="410" stroke="#e2b955" stroke-width="7" stroke-linecap="round"/>' for i in range(14))
        + f'<rect x="168" y="250" width="190" height="34" rx="8" fill="#c0392b" stroke="{INK}" stroke-width="5"/>'))
    save("icons/parmesan.svg", icon(
        f'<path d="M 100 330 L 400 330 L 400 250 L 150 170 Z" fill="#f4dc8e" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 400 250 L 400 330" stroke="#c7a24a" stroke-width="18"/>'
        + "".join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e2c26a"/>' for x, y, r in [(200, 280, 12), (280, 300, 9), (320, 270, 7), (240, 240, 8)])))
    save("icons/rolling-pin.svg", icon(
        f'<g transform="rotate(-20 256 256)"><rect x="110" y="215" width="292" height="82" rx="41" fill="#e6c08a" stroke="{INK}" stroke-width="6"/>'
        f'<rect x="30" y="236" width="90" height="40" rx="20" fill="#b47740" stroke="{INK}" stroke-width="6"/><rect x="392" y="236" width="90" height="40" rx="20" fill="#b47740" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 150 238 L 360 238" stroke="#fff" stroke-width="8" opacity=".6" stroke-linecap="round"/></g>'))
    save("icons/pot.svg", icon(
        f'<path d="M 120 220 L 392 220 L 372 400 C 360 420, 152 420, 140 400 Z" fill="#8f9aa3" stroke="{INK}" stroke-width="6"/>'
        f'<ellipse cx="256" cy="220" rx="136" ry="30" fill="#5d8fb5" stroke="{INK}" stroke-width="6"/>'
        f'<rect x="80" y="230" width="44" height="22" rx="10" fill="#555" stroke="{INK}" stroke-width="5"/><rect x="388" y="230" width="44" height="22" rx="10" fill="#555" stroke="{INK}" stroke-width="5"/>'
        + "".join(f'<path d="M {x} 170 C {x - 20} 140, {x + 20} 120, {x} 90" stroke="#cfd8df" stroke-width="10" fill="none" stroke-linecap="round" opacity=".8"/>' for x in (200, 256, 312))))
    save("icons/oven.svg", icon(
        f'<path d="M 90 400 L 90 230 C 90 120, 422 120, 422 230 L 422 400 Z" fill="#b5532f" stroke="{INK}" stroke-width="6"/>'
        + "".join(f'<path d="M {100 + i * 40} 400 L {100 + i * 40} 240" stroke="#9c4426" stroke-width="3"/>' for i in range(8))
        + f'<path d="M 170 400 L 170 300 C 170 240, 342 240, 342 300 L 342 400 Z" fill="#2a1408" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 210 390 C 220 340, 250 330, 256 300 C 262 330, 300 340, 302 390 Z" fill="#ff9a2e"/>'
        f'<path d="M 236 392 C 240 360, 254 352, 256 336 C 260 352, 274 360, 276 392 Z" fill="#ffe066"/>'))
    save("icons/knead.svg", icon(
        f'<ellipse cx="256" cy="360" rx="160" ry="36" fill="#000" opacity=".15"/>'
        f'<path d="M 100 350 C 90 250, 190 210, 256 214 C 330 210, 430 250, 412 350 C 390 380, 120 380, 100 350 Z" fill="url(#dough)" stroke="{INK}" stroke-width="6"/>'
        f'<path d="M 150 300 C 200 280, 300 280, 360 300" stroke="#d9b277" stroke-width="8" fill="none" stroke-linecap="round"/>'
        f'<g transform="rotate(-12 256 200)"><path d="M 170 250 L 170 150 C 170 120, 200 120, 204 150 L 206 120 C 206 92, 240 92, 242 120 L 244 112 C 246 86, 280 86, 280 114 L 282 126 C 284 100, 316 102, 316 130 L 316 250 Z" fill="#f2c9a0" stroke="{INK}" stroke-width="6" stroke-linejoin="round"/></g>'))
    save("icons/toss.svg", icon(
        f'<ellipse cx="236" cy="300" rx="170" ry="80" fill="#3a3a3a" stroke="{INK}" stroke-width="6"/>'
        f'<ellipse cx="236" cy="288" rx="140" ry="58" fill="#5a5a5a"/>'
        + "".join(f'<path d="M {150 + i * 22} 300 C {170 + i * 22} 200, {210 + i * 22} 200, {230 + i * 22} 290" stroke="#e2b955" stroke-width="8" fill="none" stroke-linecap="round"/>' for i in range(6))
        + f'<path d="M 170 280 C 210 250, 270 250, 310 280" stroke="#c0392b" stroke-width="16" fill="none" stroke-linecap="round" opacity=".85"/>'
        f'<rect x="396" y="282" width="110" height="28" rx="12" fill="#222" stroke="{INK}" stroke-width="5"/>'))


# --- scene pieces ---------------------------------------------------------------------------

def board():
    rings = "".join(f'<ellipse cx="256" cy="262" rx="{220 - i * 34}" ry="{156 - i * 24}" fill="none" stroke="#a46a35" stroke-width="2" opacity=".5"/>' for i in range(5))
    save("board.svg", svg(
        f'<ellipse cx="256" cy="276" rx="244" ry="172" fill="#000" opacity=".2"/>'
        f'<ellipse cx="256" cy="262" rx="244" ry="172" fill="url(#wood)" stroke="{INK}" stroke-width="6"/>'
        f'<ellipse cx="256" cy="262" rx="226" ry="158" fill="none" stroke="#8a5528" stroke-width="4"/>' + rings,
        defs=GRADS))


def cloth():
    cells = ""
    for r in range(8):
        for c in range(8):
            if (r + c) % 2 == 0:
                cells += f'<rect x="{c * 64}" y="{r * 64}" width="64" height="64" fill="#c8362b"/>'
    save("cloth.svg", svg(
        f'<g transform="translate(256 256) scale(1 .62) rotate(45) translate(-256 -256)">'
        f'<rect width="512" height="512" fill="#fbf6ec"/>{cells}'
        f'<rect width="512" height="512" fill="none" stroke="#8f1d10" stroke-width="10"/></g>'))


def dining():
    w, h = 1672, 941
    bulbs = "".join(
        f'<circle cx="{x}" cy="{70 + 30 * math.sin(x / 140)}" r="12" fill="#ffe7a3"/><circle cx="{x}" cy="{70 + 30 * math.sin(x / 140)}" r="28" fill="#ffd36b" opacity=".25"/>'
        for x in range(60, w, 110))
    bottles = "".join(
        f'<rect x="{x}" y="{y - 70}" width="26" height="70" rx="8" fill="{c}" stroke="#1d120b" stroke-width="3"/><rect x="{x + 8}" y="{y - 92}" width="10" height="26" fill="{c}" stroke="#1d120b" stroke-width="3"/>'
        for x, y, c in [(110, 300, "#2f5d2a"), (150, 300, "#6b1f2a"), (190, 300, "#2f5d2a"), (110, 430, "#6b1f2a"), (160, 430, "#3d3d1d"), (205, 430, "#2f5d2a"),
                        (1440, 300, "#6b1f2a"), (1480, 300, "#2f5d2a"), (1520, 300, "#3d3d1d"), (1450, 430, "#2f5d2a"), (1500, 430, "#6b1f2a")])
    shelves = "".join(f'<rect x="{x}" y="{y}" width="170" height="14" fill="#6e4524"/>' for x in (90, 1420) for y in (300, 430))
    planks = "".join(f'<rect x="0" y="{y}" width="{w}" height="2" fill="#a0703e" opacity=".5"/>' for y in range(600, h, 46))
    tables = "".join(
        f'<rect x="{x - 90}" y="470" width="180" height="70" fill="#fbf6ec" stroke="#8f1d10" stroke-width="3"/>'
        + "".join(f'<rect x="{x - 90 + i * 30}" y="470" width="15" height="70" fill="#c8362b" opacity=".85"/>' for i in range(6))
        + f'<circle cx="{x}" cy="455" r="14" fill="#ffd36b" opacity=".9"/>'
        for x in (420, 1250))
    body = (
        f'<rect width="{w}" height="{h}" fill="#c9774a"/>'
        f'<rect width="{w}" height="560" fill="url(#wall)"/>'
        f'<rect y="400" width="{w}" height="160" fill="#7a4a2a"/>'
        + "".join(f'<rect x="{x}" y="400" width="6" height="160" fill="#5e3820"/>' for x in range(0, w, 90))
        + f'<path d="M 676 520 L 676 230 A 160 160 0 0 1 996 230 L 996 520 Z" fill="url(#sky)" stroke="#5e3820" stroke-width="18"/>'
        f'<path d="M 836 70 L 836 520 M 676 300 L 996 300" stroke="#5e3820" stroke-width="10"/>'
        f'<path d="M 690 520 L 980 520 L 1000 548 L 670 548 Z" fill="#8a5528"/>'
        f'<rect x="590" y="120" width="70" height="420" fill="#2f6b3a" stroke="#1d3f22" stroke-width="6"/><rect x="1012" y="120" width="70" height="420" fill="#2f6b3a" stroke="#1d3f22" stroke-width="6"/>'
        + "".join(f'<line x1="{x}" y1="{y}" x2="{x + 70}" y2="{y}" stroke="#1d3f22" stroke-width="4"/>' for x in (590, 1012) for y in range(150, 540, 40))
        + shelves + bottles + tables
        + f'<rect x="1150" y="150" width="210" height="150" rx="8" fill="#2b2b2b" stroke="#6e4524" stroke-width="12"/>'
        f'<text x="1255" y="205" font-family="Georgia, serif" font-size="30" fill="#f5efe0" text-anchor="middle">Bella</text>'
        f'<text x="1255" y="245" font-family="Georgia, serif" font-size="30" fill="#f5efe0" text-anchor="middle">Trattoria</text>'
        f'<text x="1255" y="282" font-family="Georgia, serif" font-size="18" fill="#f0c05a" text-anchor="middle">Pizza · Pasta</text>'
        f'<path d="M 0 {70 + 30 * math.sin(0)} ' + " ".join(f"L {x} {70 + 30 * math.sin(x / 140):.0f}" for x in range(0, w + 1, 20)) + '" stroke="#3a2a1a" stroke-width="3" fill="none"/>'
        + bulbs
        + f'<rect y="560" width="{w}" height="{h - 560}" fill="url(#counter)"/>' + planks
        + f'<rect y="556" width="{w}" height="8" fill="#f0c58e"/>'
    )
    defs = (
        '<linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8653c"/><stop offset="1" stop-color="#d98a56"/></linearGradient>'
        '<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6aa6d8"/><stop offset=".6" stop-color="#f5c27a"/><stop offset="1" stop-color="#f08a4b"/></linearGradient>'
        '<linearGradient id="counter" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2b07a"/><stop offset="1" stop-color="#c88a52"/></linearGradient>'
    )
    save("dining.svg", svg(body, w, h, defs))


def counter():
    w, h = 1672, 941
    planks = "".join(f'<rect x="0" y="{y}" width="{w}" height="3" fill="#9c6a3a" opacity=".45"/>' for y in range(220, h, 80))
    grain = "".join(f'<path d="M {x} {y} q 60 -8 120 0 t 120 0" stroke="#b07a46" stroke-width="2" fill="none" opacity=".35"/>' for x in range(40, w, 260) for y in range(260, h, 80))
    flour = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{rx * .6:.0f}" fill="#fff" opacity=".35"/>' for x, y, rx in [(360, 520, 120), (1260, 720, 140), (540, 820, 90), (1120, 380, 80)])
    bowls = ""
    for i, c in enumerate(["#c8362b", "#f4e6cc", "#3f9a3c", "#f4dc8e", "#c49a6c", "#e2b955", "#fffdf6"]):
        x = 300 + i * 175
        bowls += f'<ellipse cx="{x}" cy="120" rx="72" ry="44" fill="#f7f2ea" stroke="{INK}" stroke-width="5"/><ellipse cx="{x}" cy="118" rx="54" ry="30" fill="{c}"/>'
    body = (
        f'<rect width="{w}" height="{h}" fill="url(#wood)"/>' + planks + grain + flour
        + f'<rect x="0" y="0" width="{w}" height="200" fill="#6e4524"/><rect x="0" y="196" width="{w}" height="10" fill="#4f301a"/>'
        + bowls
        + f'<g transform="rotate(-25 170 560)"><rect x="40" y="535" width="260" height="56" rx="28" fill="#e6c08a" stroke="{INK}" stroke-width="5"/>'
          f'<rect x="-20" y="550" width="70" height="26" rx="13" fill="#b47740" stroke="{INK}" stroke-width="4"/><rect x="290" y="550" width="70" height="26" rx="13" fill="#b47740" stroke="{INK}" stroke-width="4"/></g>'
        + f'<circle cx="1530" cy="560" r="80" fill="#b5532f" stroke="{INK}" stroke-width="5"/>'
        + "".join(leaf(1530 + math.cos(a) * 30, 560 + math.sin(a) * 30, math.degrees(a), 1.1) for a in [i * math.pi / 3 for i in range(6)])
        + f'<rect x="1440" y="760" width="60" height="140" rx="20" fill="#9bb54a" opacity=".85" stroke="{INK}" stroke-width="5"/><rect x="1458" y="720" width="24" height="46" fill="#3d3d1d" stroke="{INK}" stroke-width="4"/>'
    )
    save("counter.svg", svg(body, w, h, GRADS))


if __name__ == "__main__":
    layers()
    icons()
    board()
    cloth()
    dining()
    counter()
    print("wrote mockups to", os.path.normpath(OUT))
