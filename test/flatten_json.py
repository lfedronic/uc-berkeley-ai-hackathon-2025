from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.schema import Document
import json

with open("manim_flat_symbols.json", "r") as f:
    data = json.load(f)

docs = [
    Document(
        page_content=f"{entry['id']} — {entry['type']} — {entry.get('module', '')}",
        metadata=entry
    ) for entry in data
]

splitter = RecursiveCharacterTextSplitter(chunk_size=512, chunk_overlap=50)
split_docs = splitter.split_documents(docs)

embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
vectorstore = FAISS.from_documents(split_docs, embedding)
vectorstore.save_local("manim_vector_flat")