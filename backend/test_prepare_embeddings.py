import os
import pytest
from prepare_embeddings import split_chunks, embed_chunks

class DummyEmbedder:
    def __init__(self, model: str, api_key: str):
        self.model = model
        self.api_key = api_key

    def embed_documents(self, texts):
        # return a vector whose only element is the text length
        return [[float(len(t))] for t in texts]

def test_split_and_embed(monkeypatch, tmp_path):
    # Create a dummy markdown file
    md_file = tmp_path / "sample.md"
    md_file.write_text("hello " * 300)

    # Load docs dict directly
    docs = {"sample.md": md_file.read_text()}
    chunks = split_chunks(docs, chunk_size=100, chunk_overlap=20)
    assert chunks, "No chunks were produced"
    assert all(cid.startswith("sample.md_chunk") for cid, _ in chunks)

    # Monkeypatch OpenAIEmbeddings and environment
    monkeypatch.setattr("prepare_embeddings.OpenAIEmbeddings", DummyEmbedder)
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")

    embeddings = embed_chunks(chunks, model_name="fake-model")
    assert len(embeddings) == len(chunks)
    for (cid, vector), (_, text) in zip(embeddings, chunks):
        # vector should be a list containing the length of the chunk text
        assert isinstance(vector, list)
        assert vector == [float(len(text))]
