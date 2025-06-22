import os, json, requests
from bs4 import BeautifulSoup
from pathlib import Path
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from google import genai
from google.genai import types
from dotenv import load_dotenv
from pathlib import Path
from bs4 import BeautifulSoup
import subprocess
import re
import sys
from openai import OpenAI


load_dotenv()  # loads from .env by default

google_key = os.getenv("GOOGLE_API_KEY")  # Fixed environment variable name
open_ai_key = os.getenv("OPENAI_API_KEY")  # Fixed environment variable name

# === CONFIG ===
DOC_DIR = "manim_docs_old"  # folder of .html pages downloaded with wget
RAW_CHUNKS_FILE = "test/temp/manim_doc_chunks.jsonl"
SPLIT_CHUNKS_FILE = "test/temp/split_manim_chunks.jsonl"
VECTORSTORE_PATH = "test/temp/manim_vectorstore_free"
OUTPUT_FILE = "test/generated_animation.py"

    # Parse command line arguments
if len(sys.argv) > 1:
    USER_QUERY = sys.argv[1]
else:
    USER_QUERY = "What is merge sort?" # Default fallback

def extract_clean_text_from_html(path):
    with open(path, "r", encoding="utf-8") as f:
        soup = BeautifulSoup(f, "html.parser")

    # Try finding the <article> or <div class="document"> tags — not just <main>
    content_area = soup.find("article") or soup.find("div", class_="document")
    if not content_area:
        return None
    
    # Remove nav/aside/footer
    for tag in content_area.find_all(["nav", "aside", "footer"]):
        tag.decompose()

    # Remove script/style
    for tag in content_area.find_all(["script", "style"]):
        tag.decompose()

    return content_area.get_text(separator="\n", strip=True)


# === STEP 1: Extract <main> tags from HTML files ===
def extract_main_content(folder_path):
    """Extracts the main textual content from HTML files in a directory."""
    chunks = []
    for file in Path(folder_path).rglob("*.html"):
        with open(file, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html.parser")

        # Try multiple selectors to find main content
        main = (
            soup.find("div", class_="main") or
            soup.find("article") or
            soup.find("div", class_="document")
        )

        if main:
            # Remove clutter tags inside main
            for tag in main.find_all(["nav", "aside", "footer", "script", "style"]):
                tag.decompose()

            text = main.get_text(separator="\n", strip=True)
            if text.strip():  # Make sure it's not empty
                chunks.append({"text": text, "source": str(file)})
    return chunks

# === Data Processing Pipeline (runs only if needed) ===
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

if not os.path.exists(VECTORSTORE_PATH):
    print("INFO: Vectorstore not found. Building from scratch...")

    # Step 1: Extract main content from HTML if raw chunks don't exist
    if not os.path.exists(RAW_CHUNKS_FILE):
        print("INFO: Raw chunks not found. Extracting from HTML...")
        
        if not os.path.exists(DOC_DIR) or not any(Path(DOC_DIR).rglob("*.html")):
            print(f"FATAL: Documentation directory '{DOC_DIR}' not found or is empty.")
            print("Please download the Manim documentation and place it in the correct directory.")
            sys.exit(1)

        chunks = extract_main_content(DOC_DIR)
        
        if not chunks:
            print(f"FATAL: No content extracted from HTML files in '{DOC_DIR}'.")
            print("This might be because the HTML structure has changed or the selectors are wrong.")
            sys.exit(1)

        os.makedirs(os.path.dirname(RAW_CHUNKS_FILE), exist_ok=True)
        with open(RAW_CHUNKS_FILE, "w", encoding="utf-8") as f:
            for chunk in chunks:
                json.dump(chunk, f)
                f.write("\n")
        print(f"✅ Extracted {len(chunks)} <main> chunks from HTML")

    # Step 2: Chunk text to ~1000 characters
    print("INFO: Splitting documents into smaller chunks...")
    with open(RAW_CHUNKS_FILE, "r", encoding="utf-8") as f:
        raw_chunks = [json.loads(line) for line in f]

    docs = [Document(page_content=chunk["text"], metadata={"source": chunk["source"]}) for chunk in raw_chunks]
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
    split_docs = splitter.split_documents(docs)
    print(f"✅ Chunked into {len(split_docs)} total docs")

    # Step 3: Embed and store in FAISS
    print("INFO: Creating and saving FAISS vectorstore...")
    vectorstore = FAISS.from_documents(split_docs, embedding)
    vectorstore.save_local(VECTORSTORE_PATH)
    print(f"✅ Saved FAISS vectorstore to {VECTORSTORE_PATH}")

else:
    print(f"✅ Loading existing FAISS vectorstore from {VECTORSTORE_PATH}")
    vectorstore = FAISS.load_local(VECTORSTORE_PATH, embedding, allow_dangerous_deserialization=True)

# === STEP 4: Retrieve relevant docs for query ===
print(f"INFO: Retrieving documents for query: '{USER_QUERY}'")
retrieved_docs = vectorstore.similarity_search(USER_QUERY, k=4)
context = "\n\n".join(doc.page_content for doc in retrieved_docs)
print(f"✅ Retrieved {len(retrieved_docs)} relevant documents")

# === STEP 5: Load and validate JSON data ===
def load_manim_symbols():
    """Load and validate Manim symbols data with fallbacks"""
    json_files = [
        "manim_full_symbols_deep.json",
        "manim_flat_symbols.json", 
        "manim_symbols.json"
    ]
    
    for json_file in json_files:
        if os.path.exists(json_file):
            try:
                with open(json_file, "r", encoding="utf-8") as f:
                    data = f.read()
                    if data.strip():  # Check if file is not empty
                        print(f"✅ Loaded {json_file} ({len(data)} characters)")
                        return data
                    else:
                        print(f"⚠️ {json_file} is empty, trying next file...")
            except Exception as e:
                print(f"⚠️ Error reading {json_file}: {e}")
                continue
    
    # Fallback: Create a minimal symbols list
    print("⚠️ No valid JSON files found, using fallback symbols")
    fallback_symbols = {
        "classes": ["Scene", "MovingCameraScene", "Line", "Circle", "Square", "Text", "Dot", "Arrow", "Rectangle", "Ellipse", "Triangle"],
        "constants": ["UP", "DOWN", "LEFT", "RIGHT", "ORIGIN", "WHITE", "BLACK", "RED", "GREEN", "BLUE", "YELLOW", "PURPLE", "ORANGE"],
        "methods": ["add", "remove", "play", "wait", "create", "fade_in", "fade_out", "move_to", "shift", "scale", "rotate"]
    }
    return json.dumps(fallback_symbols, indent=2)

# Load the symbols data
json_data = load_manim_symbols()

# === STEP 6: Create a more focused and effective prompt ===
def create_animation_prompt(query, context, symbols_data):
    """Create a focused prompt that reduces hallucination"""
    
    # Limit the symbols data to prevent token overflow
    if len(symbols_data) > 10000:
        symbols_data = symbols_data[:10000] + "\\n... (truncated for length)"
    
    prompt = f"""You are a Manim animation expert. Create a Python animation for: "{query}"

IMPORTANT RULES:
1. Use ONLY these Manim classes and methods: {symbols_data}
2. Do NOT use any classes or methods not listed above.
3. Keep the animation simple, focused, and always visible within the frame.
4. Use `MovingCameraScene` to control the view and ensure all elements are visible.
5. Position objects relative to each other (e.g., `object2.next_to(object1, DOWN)`) or centered on the screen. Avoid large absolute coordinates like `shift(DOWN*5)`.
6. At the start of the animation, you can use `self.camera.frame.scale(1.2)` to zoom out slightly if many objects are on screen.

Manim Documentation Context:
{context[:2000]}  # Limit context length

Create a Python script with:
- A single class that inherits from `MovingCameraScene`.
- A `construct()` method that creates animations that stay within the frame.
- No explanations, just code.

Return ONLY the Python code, no markdown formatting."""

    return prompt

# === STEP 7: Generate the animation code ===
client = genai.Client(api_key=google_key)

# Create the improved prompt
prompt = create_animation_prompt(USER_QUERY, context, json_data)

print(f"🎬 Generating animation for: {USER_QUERY}")
print(f"📝 Prompt length: {len(prompt)} characters")

try:
    response = client.models.generate_content(
        model='gemini-2.0-flash-exp',  # Use a more recent model
        contents=prompt,
        config={
            "temperature": 0.3,  # Lower temperature for more consistent output
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 4000,
        }
    )
    
    code = response.text
    print("✅ Successfully generated animation code")
    
except Exception as e:
    print(f"❌ Error generating code: {e}")
    # Fallback to a simple template
    code = f'''from manim import *

class {USER_QUERY.replace(" ", "").replace("?", "")}Animation(Scene):
    def construct(self):
        # Title
        title = Text("{USER_QUERY}", font_size=36)
        self.play(Write(title))
        self.wait(1)
        
        # Simple animation
        circle = Circle(radius=1, color=BLUE)
        self.play(Create(circle))
        self.wait(1)
        
        # Clean up
        self.play(FadeOut(title), FadeOut(circle))
        self.wait(0.5)
'''

# Clean the response
code = code.replace("```python", "").replace("```", "").strip()

# Ensure the Manim wildcard import is present
if "from manim import *" not in code:
    code = f"from manim import *\\n\\n{code}"

# === STEP 8: Save the generated code ===
file_name = f'test/generated_animation_code/gemini/{"_".join(USER_QUERY.split(" ")[:5])}.py'
os.makedirs(os.path.dirname(file_name), exist_ok=True)

with open(file_name, "w", encoding="utf-8") as f:
    f.write(code)

print(f"✅ Manim animation code saved to: {file_name}")

# === STEP 9: Extract class name and optionally run ===
class_name = None
match = re.search(r'class\s+(\w+)\s*\(', code)
if match:
    class_name = match.group(1)
    print(f"✅ Found class name: {class_name}")
else:
    print("⚠️ Could not find a class name in the generated code")

# Optionally run the animation
if class_name:
    print(f"🎬 Running animation: {class_name}")
    cmd = ["python3", "-m", "manim", "-pql", file_name, class_name]
    print(f"Command: {' '.join(cmd)}")
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print("✅ Animation rendered successfully!")
            # Extract output file paths
            output_files = re.findall(r'Rendered (.+\.(mp4|gif|png))', result.stdout)
            for file in output_files:
                print(f"📹 Output file: {file}")
        else:
            print(f"❌ Animation failed: {result.stderr}")
    except subprocess.TimeoutExpired:
        print("⏰ Animation timed out")
    except Exception as e:
        print(f"❌ Error running animation: {e}")
else:
    print("⚠️ Skipping animation run due to missing class name")