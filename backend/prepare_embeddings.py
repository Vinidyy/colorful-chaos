import os
import glob
from typing import Dict, List, Tuple
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from dotenv import load_dotenv


def load_markdown_files(md_folder: str) -> Dict[str, str]:
    """
    Read all .md files under md_folder and return a mapping
    from filename to its full text content.
    """
    docs = {}
    pattern = os.path.join(md_folder, "*.md")
    for path in glob.glob(pattern):
        name = os.path.basename(path)
        with open(path, "r", encoding="utf-8") as f:
            docs[name] = f.read()
    return docs


def split_chunks(
    docs: Dict[str, str],
    chunk_size: int = 1000,
    chunk_overlap: int = 200
) -> List[Tuple[str, str]]:
    """
    Split each document’s text into overlapping chunks.
    Returns a list of tuples: (source_filename, chunk_text).
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap
    )
    chunks = []
    for name, text in docs.items():
        for i, chunk in enumerate(splitter.split_text(text)):
            chunks.append((f"{name}_chunk{i}", chunk))
    return chunks


load_dotenv()                           # load .env into os.environ
def embed_chunks(
    chunks: List[Tuple[str, str]],
    model_name: str = "text-embedding-ada-002"
) -> List[Tuple[str, List[float]]]:
    """
    Generate embeddings for each text chunk.
    Returns list of (chunk_id, embedding_vector).
    """
    texts = [chunk for _, chunk in chunks]
    # load API key from environment
    openai_key = os.getenv("OPENAI_API_KEY")
    embedder = OpenAIEmbeddings(model=model_name, api_key=openai_key)
    vectors = embedder.embed_documents(texts)
    return list(zip([cid for cid, _ in chunks], vectors))


def main():
    script_dir = os.path.dirname(__file__)
    md_folder = os.path.join(script_dir, "markdown")
    # 1. Load markdown files
    docs = load_markdown_files(md_folder)
    # 2. Split into chunks
    chunks = split_chunks(docs)
    # 3. Embed chunks
    embeddings = embed_chunks(chunks)
    # embeddings now ready for storage or further indexing
    print(f"Generated embeddings for {len(embeddings)} chunks.")


if __name__ == "__main__":
    main()
