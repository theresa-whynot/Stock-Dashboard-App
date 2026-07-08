import base64
import json
import os
import secrets
import time
from pathlib import Path
from typing import Any
from urllib.parse import urlencode

import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import HTMLResponse

load_dotenv()

router = APIRouter(prefix="/api/schwab", tags=["schwab"])

AUTH_URL = "https://api.schwabapi.com/v1/oauth/authorize"
TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token"
ACCOUNTS_URL = "https://api.schwabapi.com/trader/v1/accounts"
DEFAULT_REDIRECT_URI = "https://127.0.0.1:8000/api/schwab/callback"


def _token_path() -> Path:
    return Path(os.getenv("SCHWAB_TOKEN_FILE", ".schwab_tokens.json"))


def _state_path() -> Path:
    return Path(os.getenv("SCHWAB_STATE_FILE", ".schwab_oauth_state"))


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173")


def _client_id() -> str | None:
    return os.getenv("SCHWAB_CLIENT_ID")


def _client_secret() -> str | None:
    return os.getenv("SCHWAB_CLIENT_SECRET")


def _redirect_uri() -> str:
    return os.getenv("SCHWAB_REDIRECT_URI", DEFAULT_REDIRECT_URI)


def _configured() -> bool:
    return bool(_client_id() and _client_secret())


def _require_config() -> tuple[str, str]:
    client_id = _client_id()
    client_secret = _client_secret()

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=503,
            detail=(
                "Schwab API is not configured. Set SCHWAB_CLIENT_ID and "
                "SCHWAB_CLIENT_SECRET in backend/.env."
            ),
        )

    return client_id, client_secret


def _read_json_file(path: Path) -> dict[str, Any] | None:
    if not path.exists():
        return None

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def _save_json_file(path: Path, data: dict[str, Any]) -> None:
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _save_tokens(tokens: dict[str, Any]) -> dict[str, Any]:
    expires_in = int(tokens.get("expires_in", 0) or 0)
    tokens["expires_at"] = int(time.time()) + expires_in
    _save_json_file(_token_path(), tokens)
    return tokens


def _basic_auth_header(client_id: str, client_secret: str) -> str:
    credentials = f"{client_id}:{client_secret}".encode("utf-8")
    encoded_credentials = base64.b64encode(credentials).decode("utf-8")
    return f"Basic {encoded_credentials}"


async def _request_tokens(payload: dict[str, str]) -> dict[str, Any]:
    client_id, client_secret = _require_config()

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.post(
            TOKEN_URL,
            data=payload,
            headers={
                "Authorization": _basic_auth_header(client_id, client_secret),
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return _save_tokens(response.json())


async def _get_access_token() -> str:
    tokens = _read_json_file(_token_path())

    if not tokens:
        raise HTTPException(
            status_code=401,
            detail="Schwab account is not connected. Start the OAuth login flow first.",
        )

    access_token = tokens.get("access_token")
    expires_at = int(tokens.get("expires_at", 0) or 0)

    if access_token and expires_at > int(time.time()) + 60:
        return access_token

    refresh_token = tokens.get("refresh_token")

    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Schwab refresh token is missing. Reconnect your Schwab account.",
        )

    refreshed_tokens = await _request_tokens(
        {"grant_type": "refresh_token", "refresh_token": refresh_token}
    )
    return refreshed_tokens["access_token"]


async def get_schwab_access_token() -> str:
    return await _get_access_token()


@router.get("/status")
def schwab_status():
    return {"configured": _configured(), "connected": _token_path().exists()}


@router.get("/login-url")
def schwab_login_url():
    client_id, _ = _require_config()
    state = secrets.token_urlsafe(32)
    _state_path().write_text(state, encoding="utf-8")

    query = urlencode(
        {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": _redirect_uri(),
            "state": state,
        }
    )

    return {"authorization_url": f"{AUTH_URL}?{query}"}


@router.get("/callback", response_class=HTMLResponse)
async def schwab_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
):
    if error:
        raise HTTPException(status_code=400, detail=error)

    if not code:
        raise HTTPException(status_code=400, detail="Missing OAuth code.")

    expected_state = _state_path().read_text(encoding="utf-8") if _state_path().exists() else None

    if expected_state and state != expected_state:
        raise HTTPException(status_code=400, detail="OAuth state mismatch.")

    await _request_tokens(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": _redirect_uri(),
        }
    )

    callback_url = str(request.url_for("schwab_callback"))
    return f"""
    <html>
      <body style="font-family: sans-serif; padding: 2rem;">
        <h1>Schwab connected</h1>
        <p>Your OAuth token was saved locally by the Python backend.</p>
        <p>Callback URL used: <code>{callback_url}</code></p>
        <a href="{_frontend_url()}">Return to the stock dashboard</a>
      </body>
    </html>
    """


@router.get("/accounts")
async def schwab_accounts(
    positions: bool = Query(default=True, description="Include account positions when available."),
):
    access_token = await _get_access_token()
    params = {"fields": "positions"} if positions else None

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            ACCOUNTS_URL,
            headers={"Authorization": f"Bearer {access_token}"},
            params=params,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return {"accounts": response.json()}
