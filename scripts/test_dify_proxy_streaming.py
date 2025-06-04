# scripts/test_dify_proxy_streaming.py

import requests
import json

# --- 配置 ---
PROXY_BASE_URL = "http://localhost:3000/api/dify/zhishiku"
ENDPOINT = "/chat-messages"
TARGET_URL = f"{PROXY_BASE_URL}{ENDPOINT}"

# --- 请求数据 ---
headers = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream' # 明确希望接收 SSE
    # 注意：这里不需要 Authorization 头
}

payload = {
    "inputs": {},
    "query": "VHF是什么", # 可以换个问题测试
    "response_mode": "streaming", # 必须是 streaming
    "conversation_id": "",       # 根据需要填写
    "user": "python-test-script", # 可以自定义用户标识
    "auto_generate_name": False
}

# --- 执行请求并处理流 ---
try:
    print(f"🔍 正在测试 Dify 代理 SSE 事件...")
    print(f"发送请求到: {TARGET_URL}")
    
    # 事件统计
    event_count = 0
    events_seen = []
    message_end_found = False
    message_event_count = 0  # 统计message事件数量，但不显示详情
    
    # 使用 stream=True 来接收流式响应
    with requests.post(TARGET_URL, headers=headers, json=payload, stream=True, timeout=60) as response:
        print(f"✅ 响应状态码: {response.status_code}")
        response.raise_for_status() # 如果状态码不是 2xx，则抛出异常

        print("\n--- 🔍 检查 SSE 事件类型 (过滤message事件) ---")
        
        # 迭代处理响应流的每一行
        for line in response.iter_lines(decode_unicode=True):
            if line and line.startswith('data: '):
                event_count += 1
                try:
                    # 解析 SSE data 内容
                    data = line[6:] # 去掉 "data: " 前缀
                    if data == '[DONE]':
                        print(f"🏁 收到流结束标记: [DONE]")
                        break
                    
                    sse_data = json.loads(data)
                    event_type = sse_data.get("event", "unknown")
                    
                    # 🎯 过滤message事件，只统计数量
                    if event_type == "message":
                        message_event_count += 1
                        # 每50个message事件显示一次进度
                        if message_event_count % 50 == 0:
                            print(f"📝 已收到 {message_event_count} 个message事件...")
                        continue  # 跳过message事件的详细处理
                    
                    # 记录其他事件类型
                    if event_type not in events_seen:
                        events_seen.append(event_type)
                        print(f"📦 新事件类型: {event_type}")
                    
                    # 显示非message事件的详情
                    print(f"🎯 事件 #{event_count}: {event_type}")
                    if event_type in ["workflow_started", "workflow_finished", "node_started", "node_finished"]:
                        # 显示工作流相关事件的基本信息
                        print(f"   - conversation_id: {sse_data.get('conversation_id', 'N/A')}")
                        print(f"   - task_id: {sse_data.get('task_id', 'N/A')}")
                    
                    # 特别关注 message_end 事件
                    if event_type == "message_end":
                        message_end_found = True
                        print(f"🎯 找到 message_end 事件! (第{event_count}个事件)")
                        print(f"   - conversation_id: {sse_data.get('conversation_id', 'N/A')}")
                        print(f"   - task_id: {sse_data.get('task_id', 'N/A')}")
                        print(f"   - metadata存在: {'metadata' in sse_data}")
                        if 'metadata' in sse_data:
                            metadata = sse_data['metadata']
                            print(f"   - usage存在: {'usage' in metadata}")
                            print(f"   - retriever_resources存在: {'retriever_resources' in metadata}")
                            if 'retriever_resources' in metadata:
                                resources = metadata['retriever_resources']
                                print(f"   - retriever_resources长度: {len(resources) if isinstance(resources, list) else 'N/A'}")
                        break # 找到 message_end 就退出
                        
                except json.JSONDecodeError:
                    # 忽略无法解析的行
                    pass
                    
        print("\n--- 📋 测试结果汇总 ---")
        print(f"总事件数: {event_count}")
        print(f"message事件数量: {message_event_count}")
        print(f"其他事件类型: {events_seen}")
        print(f"是否找到 message_end: {'✅ 是' if message_end_found else '❌ 否'}")
        
        if not message_end_found:
            print("\n⚠️  警告: 没有收到 message_end 事件!")
            print("这解释了为什么 metadata 没有被保存。")
        else:
            print("\n✅ 成功收到 message_end 事件，包含完整metadata!")

except requests.exceptions.RequestException as e:
    print(f"\n❌ 请求错误: {e}")
except Exception as e:
    print(f"\n❌ 一般错误: {e}")