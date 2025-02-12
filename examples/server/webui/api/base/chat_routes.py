from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import json

class BaseModelRouter:
    """基础模型路由类"""
    def __init__(self):
        self.system_prompt = "你是一个专业的日志分析专家。请分析提供的日志内容，找出关键信息、错误和潜在的问题。"
        self.router = APIRouter()
        self.setup_routes()

    def setup_routes(self):
        @self.router.post("/analyze-log/{model_name}")
        async def analyze_log(model_name: str, request: Request):
            data = await request.json()
            return StreamingResponse(
                self.stream_response(data["content"]),
                media_type="text/event-stream"
            )

    async def stream_response(self, content: str) -> AsyncGenerator[str, None]:
        """需要被子类实现的流式响应方法"""
        raise NotImplementedError 