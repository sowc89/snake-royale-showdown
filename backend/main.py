"""Legacy entrypoint kept for compatibility. Use `uv run python backend.app:app` or run uvicorn."""

def main():
    print("Use an ASGI server to run the FastAPI app (e.g. uvicorn backend.app:app)")


if __name__ == "__main__":
    main()
