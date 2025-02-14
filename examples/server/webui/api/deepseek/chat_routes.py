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
        
        # 注册路由
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
                request_body = {
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": prompt},
                        {"role": "user", "content": content}
                    ],
                    "stream": True,
                    "temperature": 0.7
                }

                logger.debug(f"发送请求到 DeepSeek API: {self.api_base}")
                
                async with client.stream(
                    "POST",
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                        "Accept": "text/event-stream"
                    },
                    json=request_body,
                    timeout=60
                ) as response:
                    if response.status_code != 200:
                        error_msg = f"DeepSeek API returned status code {response.status_code}"
                        logger.error(error_msg)
                        yield f"data: {json.dumps({'error': error_msg})}\n\n"
                        return

                    buffer = ""
                    async for chunk in response.aiter_bytes():
                        if chunk:
                            try:
                                text = chunk.decode()
                                buffer += text
                                
                                # 处理完整的 data: 行
                                while '\n' in buffer:
                                    line, buffer = buffer.split('\n', 1)
                                    line = line.strip()
                                    
                                    if line.startswith("data: "):
                                        try:
                                            data = line[6:]
                                            if data == "[DONE]":
                                                continue
                                            
                                            # 尝试解析 JSON
                                            json_data = json.loads(data)
                                            
                                            # 检查是否有内容
                                            if "choices" in json_data and json_data["choices"][0].get("delta", {}).get("content"):
                                                content = json_data["choices"][0]["delta"]["content"]
                                                yield f"data: {json.dumps({'choices': [{'delta': {'content': content}}]})}\n\n"
                                                await asyncio.sleep(0)  # 让出控制权确保流式输出
                                        
                                        except json.JSONDecodeError:
                                            # 如果 JSON 解析失败，可能是多行 JSON
                                            logger.warning(f"JSON 解析错误: {line}")
                                            continue
                                        except Exception as e:
                                            logger.error(f"处理响应时发生错误: {str(e)}")
                                            continue

                            except Exception as e:
                                logger.error(f"处理响应块时发生错误: {str(e)}")
                                continue

        except Exception as e:
            error_msg = f"请求 DeepSeek API 时发生错误: {str(e)}"
            logger.error(error_msg)
            yield f"data: {json.dumps({'error': error_msg})}\n\n"