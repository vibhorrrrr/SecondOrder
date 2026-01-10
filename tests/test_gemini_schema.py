"""
Integration tests for Gemini API schema functionality.
Uses the new google-genai SDK per:
https://ai.google.dev/gemini-api/docs/structured-output
"""
import os
import sys
from typing import List, Optional
from pydantic import BaseModel, Field

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from google import genai

API_KEY = os.environ.get("GOOGLE_API_KEY")
MODEL_NAME = "gemini-2.5-flash"


# ============================================================================
# Test Schemas
# ============================================================================

class SimpleSchema(BaseModel):
    """Simple schema with required fields."""
    name: str
    value: int


class SchemaWithDescription(BaseModel):
    """Schema with Field descriptions."""
    name: str = Field(description="The name of the item")
    value: int = Field(description="A numeric value")


class SchemaWithOptional(BaseModel):
    """Schema with Optional fields - matching official docs pattern."""
    name: str = Field(description="Required name")
    value: Optional[int] = Field(description="Optional value")


class ListSchema(BaseModel):
    """Schema with list fields."""
    items: List[str]
    numbers: List[int]


class NestedSchema(BaseModel):
    """Schema with nested model."""
    class Point(BaseModel):
        x: int
        y: int
    
    name: str
    point: Point


# ============================================================================
# Test Function
# ============================================================================

def test_schema(schema_class: type[BaseModel], test_name: str, prompt: str) -> dict:
    """Test a schema with Gemini using the new SDK."""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"Schema: {schema_class.__name__}")
    print(f"{'='*60}")
    
    json_schema = schema_class.model_json_schema()
    print(f"JSON Schema: {json_schema}")
    
    result = {
        "test_name": test_name,
        "schema": schema_class.__name__,
        "success": False,
        "error": None,
        "response": None,
    }
    
    try:
        client = genai.Client(api_key=API_KEY)
        
        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_json_schema": json_schema,
            },
        )
        
        parsed = schema_class.model_validate_json(response.text)
        
        print(f"SUCCESS!")
        print(f"Response: {parsed}")
        result["success"] = True
        result["response"] = parsed.model_dump()
        
    except Exception as e:
        print(f"FAILED: {type(e).__name__}: {e}")
        result["error"] = str(e)
    
    return result


def run_all_tests():
    """Run all schema tests."""
    if not API_KEY:
        print("ERROR: GOOGLE_API_KEY not set")
        return
    
    print(f"google-genai SDK")
    print(f"Model: {MODEL_NAME}")
    
    results = []
    
    results.append(test_schema(
        SimpleSchema,
        "Simple required fields",
        "Return a JSON object with name='test' and value=42"
    ))
    
    results.append(test_schema(
        SchemaWithDescription,
        "Fields with descriptions",
        "Return a JSON object with name='hello' and value=100"
    ))
    
    results.append(test_schema(
        SchemaWithOptional,
        "Optional field (docs pattern)",
        "Return a JSON object with name='foo'. You can optionally include value."
    ))
    
    results.append(test_schema(
        ListSchema,
        "List fields",
        "Return a JSON with items=['a','b','c'] and numbers=[1,2,3]"
    ))
    
    results.append(test_schema(
        NestedSchema,
        "Nested schema",
        "Return a JSON with name='origin' and point with x=0, y=0"
    ))
    
    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    passed = sum(1 for r in results if r["success"])
    print(f"Passed: {passed}/{len(results)}")
    for r in results:
        status = "✓" if r["success"] else "✗"
        print(f"  {status} {r['test_name']}")
        if r["error"]:
            print(f"      Error: {r['error'][:80]}...")
    
    return results


if __name__ == "__main__":
    run_all_tests()
