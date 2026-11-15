import zlib
import struct
import math
import os

def create_png(width, height, pixel_fn):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixel_fn(x, y)
            raw_data.extend((int(r), int(g), int(b), int(a)))
    
    def chunk(tag, data):
        return struct.pack("!I", len(data)) + tag + data + struct.pack("!I", zlib.crc32(tag + data) & 0xffffffff)

    ihdr = struct.pack("!IIBBBBB", width, height, 8, 6, 0, 0, 0)
    idat = zlib.compress(bytes(raw_data), 9)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", idat) + chunk(b"IEND", b"")

def clamp(val, min_v=0, max_v=255):
    return max(min_v, min(max_v, val))

def blend(c_back, c_fore):
    # c_back and c_fore: (r, g, b, a) where a is 0.0 - 1.0
    br, bg, bb, ba = c_back
    fr, fg, fb, fa = c_fore
    out_a = fa + ba * (1.0 - fa)
    if out_a <= 0:
        return (0, 0, 0, 0)
    out_r = (fr * fa + br * ba * (1.0 - fa)) / out_a
    out_g = (fg * fa + bg * ba * (1.0 - fa)) / out_a
    out_b = (fb * fa + bb * ba * (1.0 - fa)) / out_a
    return (out_r, out_g, out_b, out_a)

def render_ashenblade_icon(size):
    # Render with 2x supersampling for ultra smooth anti-aliased edges
    scale = size / 200.0  # reference design 200x200
    cx, cy = size / 2.0, size / 2.0

    def sample_point(px, py):
        # Coordinates in reference space 0..200
        rx = px / scale
        ry = py / scale
        dx = rx - 100.0
        dy = ry - 100.0
        dist = math.sqrt(dx * dx + dy * dy)

        # Base background: deep slate #0e121a
        color = (14.0, 18.0, 26.0, 1.0)

        # Subtle dark radiant gradient in background
        bg_glow = max(0.0, 1.0 - dist / 110.0)
        color = (
            color[0] + 10 * bg_glow,
            color[1] + 14 * bg_glow,
            color[2] + 25 * bg_glow,
            1.0
        )

        # Outer Shield/Circle badge (radius 78, safe within 80% circle which is r=80 in 200px box)
        # Outer golden ring: r between 74 and 80
        if 74.0 <= dist <= 80.0:
            ring_factor = 1.0 - abs(dist - 77.0) / 3.0
            gold_r = 255.0
            gold_g = 210.0 + 30.0 * (dy / 80.0)
            gold_b = 63.0
            color = blend(color, (gold_r, gold_g, gold_b, ring_factor))
        elif dist < 74.0:
            # Inner circle background: deep navy fantasy backdrop
            inner_shade = 1.0 - dist / 74.0
            r_in = 20.0 + inner_shade * 15.0
            g_in = 26.0 + inner_shade * 20.0
            b_in = 40.0 + inner_shade * 35.0
            color = blend(color, (r_in, g_in, b_in, 0.95))

            # Magical glowing oak leaves / runes behind sword
            # Left leaf curve
            lx = rx - 75.0
            ly = ry - 110.0
            if -18 <= lx <= 18 and -25 <= ly <= 25:
                leaf_dist = math.sqrt(lx*lx + ly*ly)
                if leaf_dist < 15:
                    leaf_alpha = (1.0 - leaf_dist / 15.0) * 0.4
                    color = blend(color, (60.0, 180.0, 90.0, leaf_alpha))

            # Right leaf curve
            rx2 = rx - 125.0
            ry2 = ry - 110.0
            if -18 <= rx2 <= 18 and -25 <= ry2 <= 25:
                leaf_dist2 = math.sqrt(rx2*rx2 + ry2*ry2)
                if leaf_dist2 < 15:
                    leaf_alpha2 = (1.0 - leaf_dist2 / 15.0) * 0.4
                    color = blend(color, (60.0, 180.0, 90.0, leaf_alpha2))

        # --- The Sword (Centered from y=40 to y=165) ---
        # Blade: y from 40 to 125.
        # Guard: y from 125 to 133.
        # Grip: y from 133 to 155.
        # Pommel: y from 155 to 165.

        # 1. Blade:
        if 38.0 <= ry <= 126.0:
            # Blade widens from tip (ry=38, half_w=0) to base (ry=125, half_w=12)
            progress = (ry - 38.0) / 87.0
            half_w = 0.5 + 11.5 * progress
            blade_x = rx - 100.0
            if abs(blade_x) <= half_w:
                # Left side of blade is lighter, right side is shaded (classic 3D metallic ridge)
                if blade_x < 0:
                    # Highlight side: silver-white
                    light = 0.7 + 0.3 * (1.0 - abs(blade_x) / half_w)
                    r_b = 230.0 * light
                    g_b = 240.0 * light
                    b_b = 255.0 * light
                else:
                    # Shadow side: steel slate
                    shade = 0.5 + 0.3 * (1.0 - blade_x / half_w)
                    r_b = 150.0 * shade
                    g_b = 165.0 * shade
                    b_b = 190.0 * shade
                # Edge glow
                if abs(blade_x) > half_w - 1.2:
                    r_b = 255.0
                    g_b = 255.0
                    b_b = 255.0
                color = blend(color, (r_b, g_b, b_b, 1.0))

        # 2. Crossguard:
        if 123.0 <= ry <= 133.0:
            guard_x = rx - 100.0
            if abs(guard_x) <= 32.0:
                # Golden wings curving slightly upwards
                curve_y = 127.0 - 3.0 * (abs(guard_x) / 32.0)**2
                if abs(ry - curve_y) <= 3.8:
                    g_shade = 0.8 + 0.2 * math.cos(guard_x * 0.1)
                    gold_r = 255.0 * g_shade
                    gold_g = 215.0 * g_shade
                    gold_b = 50.0 * g_shade
                    color = blend(color, (gold_r, gold_g, gold_b, 1.0))

        # Ruby Gem at center of guard:
        gem_dist = math.sqrt((rx - 100.0)**2 + (ry - 127.0)**2)
        if gem_dist <= 4.5:
            gem_shade = 1.0 - gem_dist / 4.5
            color = blend(color, (230.0 + 25.0 * gem_shade, 40.0 * gem_shade, 60.0 * gem_shade, 1.0))

        # 3. Grip (Hilt):
        if 133.0 <= ry <= 153.0:
            grip_x = rx - 100.0
            if abs(grip_x) <= 4.0:
                # Brown leather wrapping with darker ridges
                wrap = math.sin((ry - 133.0) * 1.5)
                grip_r = 90.0 + 30.0 * wrap
                grip_g = 55.0 + 20.0 * wrap
                grip_b = 35.0 + 10.0 * wrap
                color = blend(color, (grip_r, grip_g, grip_b, 1.0))

        # 4. Pommel:
        pommel_dist = math.sqrt((rx - 100.0)**2 + (ry - 158.0)**2)
        if pommel_dist <= 7.0:
            p_shade = 1.0 - pommel_dist / 7.0
            color = blend(color, (255.0, 210.0 * p_shade + 30.0, 60.0, 1.0))

        return color

    def pixel_fn(x, y):
        # 2x2 supersampling
        sub_samples = [
            (x + 0.25, y + 0.25),
            (x + 0.75, y + 0.25),
            (x + 0.25, y + 0.75),
            (x + 0.75, y + 0.75)
        ]
        tot_r, tot_g, tot_b, tot_a = 0.0, 0.0, 0.0, 0.0
        for sx, sy in sub_samples:
            r, g, b, a = sample_point(sx, sy)
            tot_r += r
            tot_g += g
            tot_b += b
            tot_a += a
        n = 4.0
        return (
            clamp(tot_r / n),
            clamp(tot_g / n),
            clamp(tot_b / n),
            clamp(tot_a / n * 255.0)
        )

    return create_png(size, size, pixel_fn)

def main():
    os.makedirs("public", exist_ok=True)
    print("Generazione icon-192.png...")
    png_192 = render_ashenblade_icon(192)
    with open("public/icon-192.png", "wb") as f:
        f.write(png_192)
    print(f"Salvata public/icon-192.png ({len(png_192)} bytes)")

    print("Generazione icon-512.png...")
    png_512 = render_ashenblade_icon(512)
    with open("public/icon-512.png", "wb") as f:
        f.write(png_512)
    print(f"Salvata public/icon-512.png ({len(png_512)} bytes)")

if __name__ == "__main__":
    main()
