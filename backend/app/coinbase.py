import os
import secrets
import time
from typing import Any

import httpx
import jwt
from jwt import PyJWTError
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Query

load_dotenv()

router = APIRouter(prefix="/api/coinbase", tags=["coinbase"])

COINBASE_API_HOST = os.getenv("COINBASE_API_HOST", "api.coinbase.com")
COINBASE_API_BASE_URL = f"https://{COINBASE_API_HOST}"
COINBASE_ACCOUNTS_PATH = "/api/v3/brokerage/accounts"


def _api_key_name() -> str | None:
    return os.getenv("COINBASE_API_KEY_NAME") or os.getenv("COINBASE_API_KEY")


def _api_private_key() -> str | None:
    raw_private_key = os.getenv("COINBASE_API_PRIVATE_KEY") or os.getenv(
        "COINBASE_API_KEY_SECRET"
    )

    if not raw_private_key:
        return None

    return raw_private_key.replace("\\n", "\n")


def _jwt_algorithm() -> str:
    return os.getenv("COINBASE_JWT_ALGORITHM", "EdDSA")


def _configured() -> bool:
    return bool(_api_key_name() and _api_private_key())


def _require_config() -> tuple[str, str]:
    api_key_name = _api_key_name()
    api_private_key = _api_private_key()

    if not api_key_name or not api_private_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Coinbase API is not configured. Set COINBASE_API_KEY_NAME and "
                "COINBASE_API_PRIVATE_KEY in backend/.env."
            ),
        )

    return api_key_name, api_private_key


def _build_jwt(method: str, path: str) -> str:
    api_key_name, api_private_key = _require_config()
    now = int(time.time())
    uri = f"{method.upper()} {COINBASE_API_HOST}{path}"

    try:
        return jwt.encode(
            {
                "sub": api_key_name,
                "iss": "coinbase-cloud",
                "nbf": now,
                "exp": now + 120,
                "aud": ["cdp_service"],
                "uri": uri,
            },
            api_private_key,
            algorithm=_jwt_algorithm(),
            headers={
                "kid": api_key_name,
                "nonce": secrets.token_hex(16),
                "typ": "JWT",
            },
        )
    except (PyJWTError, ValueError, TypeError) as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Unable to sign Coinbase API request. Check COINBASE_API_KEY_NAME, "
                "COINBASE_API_PRIVATE_KEY, and COINBASE_JWT_ALGORITHM in backend/.env. "
                "For Ed25519 keys, use COINBASE_JWT_ALGORITHM=EdDSA and preserve "
                "the private key header/footer and escaped newlines."
            ),
        ) from error


async def _coinbase_get(
    path: str,
    params: dict[str, Any] | None = None,
) -> dict[str, Any]:
    token = _build_jwt("GET", path)

    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.get(
            f"{COINBASE_API_BASE_URL}{path}",
            headers={"Authorization": f"Bearer {token}"},
            params=params,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=502,
            detail="Coinbase returned an unexpected account response.",
        )

    return data


@router.get("/status")
def coinbase_status():
    return {"configured": _configured()}


@router.get("/accounts")
async def coinbase_accounts(
    limit: int = Query(
        default=250,
        ge=1,
        le=250,
        description="Maximum Coinbase accounts to return.",
    ),
):
    return await _coinbase_get(COINBASE_ACCOUNTS_PATH, params={"limit": limit})
