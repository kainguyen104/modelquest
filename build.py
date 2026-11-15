"""Build index.html from the files in src/.

The app has no framework and no bundler: the stylesheet, the page shell and the
JavaScript files are joined in this order into one page. Order matters, because
every file shares one global scope (core helpers first, boot last).

    python3 build.py
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
JS = ["j1_core.js", "j2_app.js", "j6_blocks.js", "j3_plans.js", "j4_decay.js", "j5_fire.js",
      "j7_cloud.js", "j7b_custom.js", "j7d_equation.js", "j7e_diagram.js", "j7f_answers.js",
      "j7c_teacher.js",
      "j8_motion.js", "j9_boot.js"]

def read(name):
    with open(os.path.join(SRC, name), encoding="utf-8") as f:
        return f.read()

page = read("p1_head.html") + "\n" + read("p2_shell.html")
page += "\n<script>\n" + "\n".join(read(f) for f in JS) + "\n</script>\n"
with open(os.path.join(ROOT, "index.html"), "w", encoding="utf-8") as f:
    f.write(page)
print("built index.html,", len(page), "bytes")
