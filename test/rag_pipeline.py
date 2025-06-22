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


load_dotenv()  # loads from .env by default

google_key = os.getenv("GOOGLE_KEY")
open_ai_key = os.getenv("OPENAPI_KEY")

# === CONFIG ===
DOC_DIR = "manim_docs_old"  # folder of .html pages downloaded with wget
RAW_CHUNKS_FILE = "manim_doc_chunks.jsonl"
SPLIT_CHUNKS_FILE = "split_manim_chunks.jsonl"
VECTORSTORE_PATH = "manim_vectorstore_free"
OUTPUT_FILE = "test/generated_animation.py"
OLLAMA_MODEL = "deepseek-coder"
USER_QUERY = "What is bubble sort?"

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

if not os.path.exists(RAW_CHUNKS_FILE):
    chunks = extract_main_content(DOC_DIR)
    with open(RAW_CHUNKS_FILE, "w", encoding="utf-8") as f:
        for chunk in chunks:
            json.dump(chunk, f)
            f.write("\n")
    print(f"✅ Extracted {len(chunks)} <main> chunks from HTML")

# === STEP 2: Chunk text to ~1000 characters ===
with open(RAW_CHUNKS_FILE, "r", encoding="utf-8") as f:
    raw_chunks = [json.loads(line) for line in f]

docs = [Document(page_content=chunk["text"], metadata={"source": chunk["source"]}) for chunk in raw_chunks]
splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
split_docs = splitter.split_documents(docs)

with open(SPLIT_CHUNKS_FILE, "w", encoding="utf-8") as f:
    for doc in split_docs:
        json.dump({"text": doc.page_content, "metadata": doc.metadata}, f)
        f.write("\n")

print(f"✅ Chunked into {len(split_docs)} total docs")

# === STEP 3: Embed and store in FAISS ===
embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

if not os.path.exists(VECTORSTORE_PATH):
    vectorstore = FAISS.from_documents(split_docs, embedding)
    vectorstore.save_local(VECTORSTORE_PATH)
    print(f"✅ Saved FAISS vectorstore to {VECTORSTORE_PATH}")
else:
    vectorstore = FAISS.load_local(VECTORSTORE_PATH, embedding, allow_dangerous_deserialization=True)
    print(f"✅ Loaded FAISS vectorstore")

# === STEP 4: Retrieve relevant docs for query ===
retrieved_docs = vectorstore.similarity_search(USER_QUERY, k=4)
context = "\n\n".join(doc.page_content for doc in retrieved_docs)
#print("CONTEXT IS", context)
# === STEP 5: Build prompt for LLM (via LLM lol) ===
prompt_for_prompt = f"""
create an extremely detailed explanation of "{USER_QUERY}", and in that prompt add details for animating it with manim, so that it can be passed into a Gemini LLM instance.
The prompt needs to make the LLM generate code that creates a hyper-specific animation. Make sure to tell it to use primitive types from the actual manim library, and to not hallucinate anything.
End your full response with "Here is some documentation about Manim:"
"""

client = genai.Client(
    api_key=google_key,
)

response = client.models.generate_content(
    model='gemini-2.5-flash', contents=prompt_for_prompt
)
prompt_helper = response.text
# === STEP 6: Prompt LLM ===
prompt = prompt_helper + f"""\n{context}
Do not hallucinate types. Stuff like "quadrant" doesnt exist
Assume that the background color will be set to white via external configuration files. So do NOT draw anything in white color.
Do not return backtick syntax either, just write the response as pure text.
Make sure things do not overlap unless they are MEANT TO.
"""
# had to install latex distro because no matter how much i specified in the prompt, it kept using latex powered types.

old_prompt = f"""
You are a Manim animation expert.

Here is some documentation about Manim:

{context}

Now write Python code using Manim that animates a DNA double helix.
Use sine curves for the backbones and lines for base pairs.
Use only primitives like Line, ParametricFunction, Dot, Text, etc.
Return only the full Python code. Do not explain anything.

"""


model = "gemini-2.5-flash-lite-preview-06-17"
response = client.models.generate_content(
    model=model, contents=prompt
)
code = response.text
# clean the response because the model keeps adding backtick/latex/md syntax for returning code blocks
code = code.replace("```python", "")
code = code.replace("```", "")

"""
# === STEP 6: Call Ollama (local LLM) ===
response = requests.post("http://localhost:11434/api/generate", json={
    "model": OLLAMA_MODEL,
    "prompt": prompt,
    "stream": False
})

code = response.json()["response"]
"""
# === STEP 7: Save code ===
file_name = "_".join(USER_QUERY.split(" ")[:5])
with open(f'test/{file_name}.py', "w") as f:
    f.write(code)

print(f"✅ Manim animation code saved to: {file_name}")


# === STEP 8: Optionally, run
# Example: python3 -m manim -pql test/Whats_the_x-y_plane?_How.py CartesianPlanePlotting

output_file = f'test/{file_name}.py'
class_name = None

# Try to extract the first class name from the generated code
match = re.search(r'class\s+(\w+)\s*\(', code)
if match:
    class_name = match.group(1)
else:
    print("⚠️ Could not find a class name in the generated code. Please specify manually.")

if class_name:
    cmd = [
        "python3", "-m", "manim", "-pql", output_file, class_name, "-c MANIM_CONFIG"
    ]
    print(f"Running: {' '.join(cmd)}")
    subprocess.run(cmd)
else:
    print("Skipping manim run due to missing class name.")