"""
Gemini API client with JSON schema enforcement via Pydantic models.

Uses the new google-genai SDK as per:
https://ai.google.dev/gemini-api/docs/structured-output
"""
import os
from typing import Type, TypeVar
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GOOGLE_API_KEY")

T = TypeVar("T", bound=BaseModel)

MODEL_NAME = "gemini-2.5-flash"


def call_gemini_with_schema(prompt: str, schema: Type[T]) -> T:
    """
    Calls Gemini with a prompt and enforces response structure via JSON schema.
    
    Args:
        prompt: The prompt to send to Gemini
        schema: A Pydantic model class defining the expected response structure
        
    Returns:
        An instance of the schema class populated with Gemini's response
        
    Raises:
        ValueError: If GOOGLE_API_KEY is not set
        Exception: If Gemini API call or parsing fails
    """
    if not API_KEY:
        raise ValueError("GOOGLE_API_KEY not set; cannot call Gemini.")

    client = genai.Client(api_key=API_KEY)
    
    response = client.models.generate_content(
        model=MODEL_NAME,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_json_schema": schema.model_json_schema(),
        },
    )
    
    return schema.model_validate_json(response.text)
