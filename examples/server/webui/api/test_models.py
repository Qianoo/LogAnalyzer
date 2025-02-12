import os
import asyncio
import json
from dotenv import load_dotenv
import openai
import httpx
import sys

# 加载环境变量
load_dotenv()

# 验证环境变量
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_API_BASE = os.getenv("DEEPSEEK_API_BASE", "https://api.deepseek.com/v1")

if not OPENAI_API_KEY or not DEEPSEEK_API_KEY:
    print("错误: 缺少必要的环境变量")
    sys.exit(1)

# 设置 OpenAI API key
openai.api_key = OPENAI_API_KEY

async def test_openai() -> None:
    """
    测试 OpenAI API 调用
    """
    print("\n=== 测试 OpenAI API ===")
    try:
        response = await openai.ChatCompletion.acreate(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "user",
                    "content": "你好"
                }
            ],
            stream=True
        )

        print("OpenAI 响应:")
        async for chunk in response:
            if chunk and chunk.choices and chunk.choices[0].delta.content:
                print(chunk.choices[0].delta.content, end='', flush=True)
        print("\n=== OpenAI 测试完成 ===")

    except Exception as e:
        print(f"OpenAI API 调用错误: {str(e)}")

async def test_deepseek() -> None:
    """
    测试 DeepSeek API 调用
    """
    print("\n=== 测试 DeepSeek API ===")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{DEEPSEEK_API_BASE}/chat/completions",
                headers={
                    "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {
                            "role": "user",
                            "content": "你好"
                        }
                    ],
                    "stream": True
                },
                timeout=60
            )

            print("DeepSeek 响应:")
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    try:
                        # 跳过 [DONE] 标记
                        if line.strip() == "data: [DONE]":
                            continue
                            
                        data = json.loads(line[6:])
                        if data.get("choices") and data["choices"][0].get("delta", {}).get("content"):
                            print(data["choices"][0]["delta"]["content"], end='', flush=True)
                    except json.JSONDecodeError:
                        # 忽略 [DONE] 导致的解析错误
                        continue
                    except Exception as e:
                        print(f"\n其他错误: {str(e)}")

            print("\n=== DeepSeek 测试完成 ===")

    except Exception as e:
        print(f"DeepSeek API 调用错误: {str(e)}")

async def main():
    # 测试两个模型
    await test_openai()
    await test_deepseek()

if __name__ == "__main__":
    # 运行测试
    asyncio.run(main())
