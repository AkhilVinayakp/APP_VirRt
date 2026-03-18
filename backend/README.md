## FindYourHome Backend (FastAPI)

### Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # on Windows
pip install -r requirements.txt
```

### Run the API

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Then open:

- `http://localhost:8000/health` – health check
- `http://localhost:8000/docs` – interactive Swagger UI

### Chat endpoint (placeholder)

- `POST /chat` with JSON body:

```json
{ "message": "2 BHK apartment in downtown under $2000/month" }
```

The endpoint returns a demo reply shaped like a virtual realtor response. In the future you can connect this to a model and a property listings data source.

