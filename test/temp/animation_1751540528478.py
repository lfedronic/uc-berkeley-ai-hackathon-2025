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
from openai import OpenAI
import sys

# Load environment variables
load_dotenv()

# Get API keys
google_key = os.getenv("GOOGLE_API_KEY")
open_ai_key = os.getenv("OPENAI_API_KEY")

# === CONFIG ===
DOC_DIR = "manim_docs_old"
RAW_CHUNKS_FILE = "test/temp/manim_doc_chunks.jsonl"
VECTORSTORE_PATH = "test/temp/manim_vectorstore_free"
OUTPUT_FILE = "test/generated_animation.py"

# Parse command line arguments
if len(sys.argv) > 1:
    USER_QUERY = sys.argv[1]
else:
    USER_QUERY = "What is merge sort?"  # Default fallback

print(f"🎬 Generating animation for: {USER_QUERY}")

 # Default fallback

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
retrieved_docs = vectorstore.similarity_search(USER_QUERY, k=2)  # Limit to 2 most relevant docs
context = "\n\n".join(doc.page_content for doc in retrieved_docs)

# === STEP 5: Build minimal JSON for Manim symbols ===
minimal_manim_symbols = {
    "classes": ["Scene", "MovingCameraScene", "Rectangle", "Text", "VGroup"],
    "constants": ["UP", "DOWN", "LEFT", "RIGHT", "ORIGIN", "WHITE", "BLACK", "RED", "GREEN", "BLUE", "YELLOW", "PURPLE", "ORANGE"],
    "methods": ["add", "remove", "play", "wait", "create", "fade_in", "fade_out", "move_to", "shift", "scale", "rotate", "Transform", "FadeIn", "FadeOut", "Indicate"]
}
json_data = json.dumps(minimal_manim_symbols, indent=2)

# === STEP 6: Minimal, focused prompt ===
prompt = f"""
Write a Manim animation that visually explains Bubble Sort step by step. Show the array as rectangles, animate every comparison and swap, use color to highlight, and add labels. The code must be at least 50 lines. Use only these Manim classes, constants, and methods: {json_data}

Here is some relevant documentation:
{context}

Return only the full Python code. Do not explain anything. Do not use markdown or backticks.
"""

# Log prompt for debugging
with open("zprompt.txt", "w") as f:
    f.write(prompt)

# Log prompt length
print(f"[Prompt Length] {len(prompt)} characters")
if len(prompt) > 6000:
    print("[WARNING] Prompt exceeds 6000 characters and may be truncated or rejected by the LLM.")

client = genai.Client(api_key=google_key)
model = "gemini-2.5-flash"
try:
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config={
            "temperature": 0.3,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 8000,
        }
    )
    code = response.text if response.text is not None else ""
    with open("zllm_output.txt", "w") as f:
        f.write(code)
    print("✅ Successfully generated animation code")
except Exception as e:
    error_msg = f"❌ Error generating code: {e}\n"
    error_msg += response.text if 'response' in locals() and response.text else "<No output>"
    with open("zllm_output.txt", "w") as f:
        f.write(error_msg)
    code = ""

# Clean the response
code = code.replace("```python", "").replace("```", "").strip()
with open("zcurrentout.txt", 'w') as f:
    f.write(code)
# Ensure the Manim wildcard import is present
if "from manim import *" not in code:
    code = f"from manim import *\n\n{code}"

# === STEP 7: Save code ===
file_name = f'test/generated_animation_code/gemini/{"_".join(USER_QUERY.split(" ")[:5])}.py'
os.makedirs(os.path.dirname(file_name), exist_ok=True)
with open(file_name, "w") as f:
    f.write(code)

print(f"✅ Manim animation code saved to: {file_name}")

# === STEP 8: Optionally, run
class_name = None
match = re.search(r'class\s+(\w+)\s*\(', code)
if match:
    class_name = match.group(1)
else:
    print("⚠️ Could not find a class name in the generated code. Please specify manually.")

if class_name:
    cmd = ["python3", "-m", "manim", "--preview", "--quality", "l", file_name, class_name]
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd)
else:
    print("Skipping manim run due to missing class name.")