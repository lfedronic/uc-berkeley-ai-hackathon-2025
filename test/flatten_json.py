import json
from manim.utils.color.core import ManimColor

# Adjust path to your actual JSON file
with open("manim_full_symbols_deep.json", "r") as f:
    full_data = json.load(f)

def flatten_json(full_data):
    chunks = []

    for module_name, module_content in full_data.items():
        if "error" in module_content:
            continue

        # Constants
        for const_name, const_val in module_content.get("constants", []):
            if isinstance(const_val, str) and "#" in const_val:
                const_type = "color"
            else:
                const_type = "constant"
            chunks.append({
                "id": const_name,
                "type": const_type,
                "value": const_val,
                "module": module_name
            })

        # Functions
        for func in module_content.get("functions", []):
            chunks.append({
                "id": func,
                "type": "function",
                "module": module_name
            })

        # Classes
        for cls, info in module_content.get("classes", {}).items():
            chunks.append({
                "id": cls,
                "type": "class",
                "module": module_name,
                "methods": info.get("methods", []),
                "class_vars": info.get("class_vars", [])
            })

    return chunks

flattened = flatten_json(full_data)

with open("manim_symbol_chunks.json", "w") as f:
    json.dump(flattened, f, indent=2)

print("✅ Flattened chunks saved to manim_symbol_chunks.json")