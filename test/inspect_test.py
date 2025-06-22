import manim
import inspect
import json
import types
import importlib
import pkgutil
from manim.utils.color.core import ManimColor

def extract_module_info(module):
    module_data = {
        "constants": [],
        "functions": [],
        "classes": {}
    }

    for name in dir(module):
        if name.startswith("_"):
            continue
        try:
            obj = getattr(module, name)
            if isinstance(obj, (int, float, str, tuple, list, dict, ManimColor)):
                module_data["constants"].append((name, repr(obj)))
            elif isinstance(obj, types.FunctionType):
                module_data["functions"].append(name)
            elif inspect.isclass(obj):
                class_info = {
                    "methods": [],
                    "class_vars": []
                }
                for member_name, member in inspect.getmembers(obj):
                    if member_name.startswith("_"):
                        continue
                    if inspect.isfunction(member) or inspect.ismethod(member):
                        class_info["methods"].append(member_name)
                    elif not inspect.isroutine(member):
                        class_info["class_vars"].append(member_name)
                module_data["classes"][name] = class_info
        except Exception:
            continue

    return module_data

def get_all_submodules(package):
    submodules = []
    package_path = package.__path__
    prefix = package.__name__ + "."
    for _, modname, ispkg in pkgutil.walk_packages(package_path, prefix):
        submodules.append(modname)
    return submodules

# Main scan
manim_symbols = {}
submodules = get_all_submodules(manim)

for submodule_name in sorted(submodules):
    try:
        submodule = importlib.import_module(submodule_name)
        print(f"✅ Processing {submodule_name}")
        manim_symbols[submodule_name] = extract_module_info(submodule)
    except Exception as e:
        print(f"⚠️ Skipped {submodule_name}: {e}")
        manim_symbols[submodule_name] = {"error": str(e)}

with open("manim_full_symbols_deep.json", "w") as f:
    json.dump(manim_symbols, f, indent=2)

print("🎉 All done. Output saved to manim_full_symbols_deep.json")