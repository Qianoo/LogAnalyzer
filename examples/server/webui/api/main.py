from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger("api")

# 在最开始加载环境变量
load_dotenv()

# 验证关键环境变量
required_env_vars = ["OPENAI_API_KEY", "DEEPSEEK_API_KEY"]
missing_vars = [var for var in required_env_vars if not os.getenv(var)]
if missing_vars:
    raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

from .openai.chat_routes import OpenAIRouter
from .deepseek.chat_routes import DeepSeekRouter

app = FastAPI()

# 更新 CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为具体的域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 创建路由实例
openai_router = OpenAIRouter()
deepseek_router = DeepSeekRouter()

@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"收到请求: {request.method} {request.url}")
    if request.method == "POST":
        body = await request.body()
        logger.debug(f"请求体: {body.decode()[:200]}...")  # 只记录前200个字符
    response = await call_next(request)
    logger.info(f"响应状态码: {response.status_code}")
    return response

# 挂载各个模型的路由
app.include_router(openai_router.router, prefix="/api/analyze-log", tags=["openai"])
app.include_router(deepseek_router.router, prefix="/api/analyze-log", tags=["deepseek"])

@app.get("/")
async def root():
    return {"message": "API 服务正常运行"}