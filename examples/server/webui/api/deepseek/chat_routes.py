import os
import httpx
from typing import AsyncGenerator
import json
from ..base.chat_routes import BaseModelRouter
import logging
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
import asyncio

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("deepseek_router")

class DeepSeekRouter(BaseModelRouter):
    def __init__(self):
        self.router = APIRouter()
        self.api_key = os.getenv("DEEPSEEK_API_KEY")
        self.api_base = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1")
        
        # 注册路由 - 修改路由路径
        self.router.post("/deepseek")(self.analyze_log)

    async def analyze_log(self, request: Request):
        try:
            data = await request.json()
            content = data.get("content", "")
            prompt = data.get("prompt", "")
            
            return StreamingResponse(
                self._generate_response(content, prompt),
                media_type="text/event-stream"
            )
        except Exception as e:
            logger.error(f"分析日志时发生错误: {str(e)}")
            return {"error": str(e)}

    async def _generate_response(self, content: str, prompt: str):
        try:
            async with httpx.AsyncClient() as client:
                # 构建请求体
                request_body = {
                    "model": "deepseek-chat",  # 确保使用正确的模型名称
                    "messages": [
                        {
                            "role": "system",
                            "content": prompt
                        },
                        {
                            "role": "user",
                            "content": content
                        }
                    ],
                    "stream": True,
                    "temperature": 0.7
                }

                logger.debug(f"发送请求到 DeepSeek API: {self.api_base}")
                logger.debug(f"请求体: {json.dumps(request_body)}")

                response = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json=request_body,
                    timeout=60
                )
                
                logger.info(f"DeepSeek API 响应状态码: {response.status_code}")
                
                if response.status_code != 200:
                    error_msg = f"DeepSeek API returned status code {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    yield f"data: {json.dumps({'error': error_msg})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        try:
                            if line.strip() == "data: [DONE]":
                                continue
                                
                            data = json.loads(line[6:])
                            if data.get("choices") and data["choices"][0].get("delta", {}).get("content"):
                                content = data["choices"][0]["delta"]["content"]
                                yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"
                        except json.JSONDecodeError:
                            logger.warning(f"JSON 解析错误: {line}")
                            continue
                        except Exception as e:
                            logger.error(f"处理响应时发生错误: {str(e)}")
                            continue
                            
        except Exception as e:
            error_msg = f"DeepSeek API 调用错误: {str(e)}"
            logger.error(error_msg)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"