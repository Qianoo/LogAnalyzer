import os
import openai
from typing import AsyncGenerator
import json
from ..base.chat_routes import BaseModelRouter

class OpenAIRouter(BaseModelRouter):
    def __init__(self):
        super().__init__()
        openai.api_key = os.getenv("OPENAI_API_KEY")

    async def stream_response(self, content: str) -> AsyncGenerator[str, None]:
        try:
            response = await openai.ChatCompletion.acreate(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user",
                        "content": content
                    }
                ],
                stream=True
            )
            
            async for chunk in response:
                if chunk and chunk.choices and chunk.choices[0].delta.content:
                    yield f"data: {json.dumps({'choices': [{'delta': {'content': chunk.choices[0].delta.content}}]})}\n\n"
                    
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"