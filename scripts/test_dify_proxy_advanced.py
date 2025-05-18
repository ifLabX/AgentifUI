# 文件路径: scripts/test_dify_proxy_advanced.py

import requests
import json
import os
from dataclasses import dataclass
from typing import List, Dict, Any, Optional, Set, Union # 添加 typing

# --- 配置 ---
# !! 修改为你本地代理的地址和要测试的 appId !!
@dataclass
class Config:
    proxy_base_url: str = "http://localhost:3000/api/dify"
    app_id: str = "default"
    user_id: str = "python-test-script"

config = Config()

# --- 测试文件路径 (相对于脚本位置) ---
# !! 确保这些文件存在于脚本同级目录或修改为正确路径 !!
TEXT_FILE_PATH = os.path.join(os.path.dirname(__file__), '../files/dummy_upload.txt')
AUDIO_FILE_PATH = os.path.join(os.path.dirname(__file__), '../files/dummy_audio.mp3') # 如果测试音频上传

# --- 测试函数 ---

def test_file_upload():
    """测试 /files/upload (multipart/form-data)"""
    endpoint = "/files/upload"
    target_url = f"{config.proxy_base_url}/{config.app_id}{endpoint}"
    print(f"\n--- Testing File Upload ---")
    print(f"Target URL: {target_url}")

    if not os.path.exists(TEXT_FILE_PATH):
        print(f"ERROR: Test file not found at {TEXT_FILE_PATH}")
        return

    # 准备 multipart/form-data 请求
    # 'file' 是 Dify API 要求的字段名
    # 'user' 字段通过 data 参数传递
    files_payload = {
        'file': (os.path.basename(TEXT_FILE_PATH), open(TEXT_FILE_PATH, 'rb'), 'text/plain')
    }
    data_payload = {
        'user': config.user_id
    }

    try:
        # 发送请求，注意这里用 files 和 data 参数，requests 会自动处理 Content-Type
        with requests.post(target_url, files=files_payload, data=data_payload, timeout=30) as response:
            print(f"Response Status Code: {response.status_code}")

            response.raise_for_status() # 检查 HTTP 错误

            # 期望返回 JSON
            response_json = response.json()
            print("Response JSON:")
            print(json.dumps(response_json, indent=2))

            # 验证关键字段是否存在 (根据 Dify 文档)
            if 'id' in response_json and 'name' in response_json:
                print("SUCCESS: File upload seems successful.")
            else:
                print("WARNING: Response JSON structure might be unexpected.")

    except requests.exceptions.RequestException as e:
        print(f"ERROR during file upload request: {e}")
    except json.JSONDecodeError:
        print(f"ERROR: Response was not valid JSON. Response text: {response.text}")
    except Exception as e:
        print(f"ERROR during file upload test: {e}")
    finally:
        # 确保文件句柄关闭 (虽然 with open 已经做了)
        if 'file' in files_payload and hasattr(files_payload['file'][1], 'close'):
             files_payload['file'][1].close()

def test_audio_to_text():
    """测试 /audio-to-text (multipart/form-data)"""
    endpoint = "/audio-to-text"
    target_url = f"{config.proxy_base_url}/{config.app_id}{endpoint}"
    print(f"\n--- Testing Audio to Text ---")
    print(f"Target URL: {target_url}")

    if not os.path.exists(AUDIO_FILE_PATH):
        print(f"INFO: Audio file not found at {AUDIO_FILE_PATH}. Skipping test.")
        print("      Create a dummy audio file (e.g., dummy_audio.mp3) to run this test.")
        return

    files_payload = {
        'file': (os.path.basename(AUDIO_FILE_PATH), open(AUDIO_FILE_PATH, 'rb'), 'audio/mpeg') # 假设是 mp3
    }
    data_payload = {
        'user': config.user_id
    }

    try:
        with requests.post(target_url, files=files_payload, data=data_payload, timeout=60) as response: # 可能需要更长超时
            print(f"Response Status Code: {response.status_code}")
            response.raise_for_status()

            response_json = response.json()
            print("Response JSON:")
            print(json.dumps(response_json, indent=2))

            if 'text' in response_json:
                print(f"SUCCESS: Audio-to-text seems successful. Result: '{response_json['text']}'")
            else:
                print("WARNING: Response JSON structure might be unexpected.")

    except requests.exceptions.RequestException as e:
        print(f"ERROR during audio-to-text request: {e}")
    except json.JSONDecodeError:
        print(f"ERROR: Response was not valid JSON. Response text: {response.text}")
    except Exception as e:
        print(f"ERROR during audio-to-text test: {e}")
    finally:
         if 'file' in files_payload and hasattr(files_payload['file'][1], 'close'):
             files_payload['file'][1].close()


def test_text_to_audio():
    """测试 /text-to-audio (接收 audio/* 响应)"""
    endpoint = "/text-to-audio"
    target_url = f"{config.proxy_base_url}/{config.app_id}{endpoint}"
    print(f"\n--- Testing Text to Audio ---")
    print(f"Target URL: {target_url}")

    headers = {
        'Content-Type': 'application/json',
        # Accept header 不一定需要，服务器会决定返回类型
    }
    payload = {
        "text": "Hello from the Next.js proxy test.",
        "user": config.user_id
        # "message_id": "..." # 如果需要基于特定消息生成，则提供 message_id
    }
    output_audio_file = "output_audio.mp3" # 保存音频的文件名

    try:
        with requests.post(target_url, headers=headers, json=payload, timeout=60, stream=False) as response: # stream=False 因为我们要完整接收
            print(f"Response Status Code: {response.status_code}")
            response.raise_for_status()

            # 检查响应头 Content-Type
            content_type = response.headers.get('content-type')
            print(f"Response Content-Type: {content_type}")

            if content_type and content_type.startswith('audio/'):
                print(f"SUCCESS: Received audio content ({content_type}).")
                # 将接收到的音频数据写入文件
                with open(output_audio_file, 'wb') as f:
                    f.write(response.content) # response.content 包含原始字节
                print(f"Audio content saved to: {output_audio_file}")
                print(f"File size: {os.path.getsize(output_audio_file)} bytes")
            else:
                print(f"ERROR: Expected audio content, but received Content-Type: {content_type}")
                print(f"Response Text: {response.text[:200]}...") # 打印部分文本以供调试

    except requests.exceptions.RequestException as e:
        print(f"ERROR during text-to-audio request: {e}")
    except Exception as e:
        print(f"ERROR during text-to-audio test: {e}")

def test_get_conversations(limit: int = 5) -> Optional[List[Dict[str, Any]]]:
    """测试 GET /conversations (获取会话列表)
    limit: 请求的会话数量
    Returns:
        成功时返回包含会话对象的列表，失败时返回 None
    """
    endpoint = "/conversations"
    target_url = f"{config.proxy_base_url}/{config.app_id}{endpoint}"
    print(f"\n--- Testing Get Conversations ---")
    print(f"Target URL: {target_url}")

    # 准备查询参数
    params = {
        'user': config.user_id,
        'limit': limit # 为了测试，请求少量数据
        # 'last_id': 'some_last_id' # 如果需要测试分页
    }

    try:
        # 发送 GET 请求，使用 params 参数传递查询字符串
        with requests.get(target_url, params=params, timeout=30) as response:
            print(f"Proxy Response Status Code: {response.status_code}")
            print("Proxy Response Headers:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")

            response.raise_for_status() # 检查 HTTP 错误

            # 期望返回 JSON
            response_json = response.json()
            print("Response JSON:")
            print(json.dumps(response_json, indent=2))

            # 验证基本结构
            if 'limit' in response_json and 'has_more' in response_json and 'data' in response_json and isinstance(response_json['data'], list):
                print(f"SUCCESS: Get conversations seems successful. Received {len(response_json['data'])} conversations.")
                return response_json['data']
            else:
                print("WARNING: Response JSON structure might be unexpected.")
    except requests.exceptions.RequestException as e:
        # 检查是否是 IncompleteRead，如果是，打印已接收内容（如果可能）
        if isinstance(e.args[0], tuple) and len(e.args[0]) > 1 and 'IncompleteRead' in str(e.args[0][1]):
            print(f"ERROR during request (IncompleteRead): {e}")
            # 尝试打印部分接收到的内容
            if hasattr(e, 'partial') and e.partial:
                print(f"Partial content received: {e.partial}")
            elif response and hasattr(response, 'content') and response.content:
                print(f"Partial content received before error: {response.content}")
        else:
            print(f"ERROR during get conversations request: {e}")
    except json.JSONDecodeError:
        print(f"ERROR: Response was not valid JSON. Status: {response.status_code}. Response text: {response.text[:500]}...")
    except Exception as e:
        print(f"ERROR during get conversations test: {e}")
    return None # 返回 None 表示失败

def _perform_delete(conversation_id: str):
    """执行单个会话的删除请求"""
    endpoint = f"/conversations/{conversation_id}"
    target_url = f"{config.proxy_base_url}/{config.app_id}{endpoint}"
    print(f"--- Deleting Conversation ID: {conversation_id} ---")
    print(f"Target URL: {target_url}")

    headers = {
        'Content-Type': 'application/json',
    }
    payload = {
        'user': config.user_id
    }

    try:
        with requests.delete(target_url, headers=headers, json=payload, timeout=30) as response:
            print(f"  Status Code: {response.status_code}")

            # 检查非成功状态码 (4xx, 5xx)
            response.raise_for_status()

            # 优先处理 Dify 删除成功时最常见的 204 No Content
            if response.status_code == 204:
                print(f"  SUCCESS: Conversation {conversation_id} deleted (Status 204 No Content).")
            else:
                # 处理其他可能的成功状态码 (例如 200 OK)
                # 仅在可能有内容时尝试解析 JSON
                try:
                    # 尝试读取响应文本，避免 response.json() 对空body报错
                    content = response.text
                    if content:
                        response_json = json.loads(content)
                        # 检查 Dify 可能返回的特定成功结构 (虽然删除通常是204)
                        if response_json.get("result") == "success":
                             print(f"  SUCCESS: Conversation {conversation_id} deleted (Status {response.status_code}, received JSON: {response_json}).")
                        else:
                            print(f"  WARNING: Delete request successful (Status {response.status_code}) but response JSON unexpected: {response_json}")
                    else:
                         # 例如 200 OK 但 body 为空
                         print(f"  SUCCESS: Conversation {conversation_id} deleted (Status {response.status_code}, empty body).")
                except json.JSONDecodeError:
                    # 如果状态码成功但响应体不是有效 JSON
                    print(f"  WARNING: Delete request successful (Status {response.status_code}) but response body was not valid JSON: {response.text[:100]}...")

    except requests.exceptions.HTTPError as e: # 明确捕获 HTTP 错误
        print(f"  ERROR deleting conversation {conversation_id}: HTTP Error {e.response.status_code} - {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"    Error Response Text: {e.response.text[:200]}...")
    except requests.exceptions.RequestException as e: # 捕获连接错误、超时等
        print(f"  ERROR deleting conversation {conversation_id}: Request Exception - {e}")
    except Exception as e: # 捕获其他意外错误
        print(f"  ERROR during delete operation for {conversation_id}: Unexpected error - {e}")

def test_delete_conversation(conversation_id_or_set: Union[str, Set[str]]):
    """测试 DELETE /conversations/{conversation_id} (删除指定会话或一组会话)

    Args:
        conversation_id_or_set: 单个会话 ID (str) 或一组会话 ID (set).
    """
    if not conversation_id_or_set:
        print("\n--- Skipping Delete Conversation Test: No conversation ID(s) provided ---")
        return

    print(f"\n--- Testing Delete Conversation(s) ---")

    if isinstance(conversation_id_or_set, str):
        # 处理单个 ID
        if not conversation_id_or_set.strip(): # 检查是否为空或仅空格
             print("ERROR: Provided single conversation ID is empty.")
             return
        print(f"Attempting to delete single conversation ID: {conversation_id_or_set}")
        _perform_delete(conversation_id_or_set)
    elif isinstance(conversation_id_or_set, set):
        # 处理 ID 集合
        if not conversation_id_or_set:
            print("INFO: Provided conversation ID set is empty. Nothing to delete.")
            return
        print(f"Attempting to delete {len(conversation_id_or_set)} conversations:")
        for conv_id in conversation_id_or_set:
             if isinstance(conv_id, str) and conv_id.strip():
                _perform_delete(conv_id)
             else:
                 print(f"  WARNING: Skipping invalid or empty ID in the set: {conv_id}")
    else:
        print(f"ERROR: Invalid type for conversation_id_or_set. Expected str or set, got {type(conversation_id_or_set)}.")


def test_get_webapp_settings():
    """测试 GET /site (获取应用 WebApp 设置)
    
    获取应用的 WebApp 设置，包括名称、颜色主题、图标等信息
    
    Returns:
        成功时返回包含 WebApp 设置的字典，失败时返回 None
    """
    endpoint = "/site"
    target_url = f"{config.proxy_base_url}/{config.app_id}{endpoint}"
    print(f"\n--- Testing Get WebApp Settings ---")
    print(f"Target URL: {target_url}")

    try:
        # 发送 GET 请求
        with requests.get(target_url, timeout=30) as response:
            print(f"Proxy Response Status Code: {response.status_code}")
            print("Proxy Response Headers:")
            for key, value in response.headers.items():
                print(f"  {key}: {value}")

            response.raise_for_status() # 检查 HTTP 错误

            # 期望返回 JSON
            response_json = response.json()
            print("Response JSON:")
            print(json.dumps(response_json, indent=2))

            # 验证关键字段是否存在
            expected_fields = [
                'title', 'chat_color_theme', 'chat_color_theme_inverted', 
                'icon_type', 'icon', 'icon_background', 'icon_url',
                'description', 'copyright', 'privacy_policy', 
                'custom_disclaimer', 'default_language',
                'show_workflow_steps', 'use_icon_as_answer_icon'
            ]
            
            missing_fields = [field for field in expected_fields if field not in response_json]
            
            if not missing_fields:
                print(f"SUCCESS: Get WebApp settings successful. All expected fields present.")
                return response_json
            else:
                print(f"WARNING: Some expected fields are missing: {missing_fields}")
                return response_json

    except requests.exceptions.RequestException as e:
        print(f"ERROR during get WebApp settings request: {e}")
    except json.JSONDecodeError:
        print(f"ERROR: Response was not valid JSON. Response text: {response.text[:200]}...")
    except Exception as e:
        print(f"ERROR during get WebApp settings test: {e}")
    
    return None


# --- 主执行逻辑 ---
if __name__ == "__main__":
    # 确保测试文件存在（至少是文本文件）
    # if not os.path.exists(TEXT_FILE_PATH):
    #      print(f"Creating dummy text file at {TEXT_FILE_PATH} for testing...")
    #      with open(TEXT_FILE_PATH, "w") as f:
    #          f.write("This is a dummy file for upload testing.")

    # 按顺序执行测试
    # test_file_upload()
    # test_audio_to_text()
    # test_text_to_audio()
    
    # 测试获取WebApp设置
    webapp_settings = test_get_webapp_settings()
    
    conversations_list = test_get_conversations(limit=5) # 获取最近5个会话

    # --- 测试删除会话 ---
    ids_to_delete: Set[str] = set()
    if conversations_list:
        print(f"\n--- Preparing for Delete Conversation Test --- Fecthed {len(conversations_list)} conversations.")
        # 提取所有获取到的会话 ID
        ids_to_delete = {conv['id'] for conv in conversations_list if isinstance(conv, dict) and 'id' in conv}
        # TODO: 在这里可以添加根据名称或其他条件过滤 ids_to_delete 的逻辑
        # 例如: ids_to_delete = {conv['id'] for conv in conversations_list if 'id' in conv and 'iPhone' in conv.get('name', '')}
        if ids_to_delete:
            print(f"Identified {len(ids_to_delete)} conversation IDs to delete: {ids_to_delete}")
        else:
             print("No valid conversation IDs found in the fetched list.")
    else:
        print("\n--- Preparing for Delete Conversation Test --- Failed to fetch conversations.")

    # 执行删除操作 (如果找到了 ID)
    if ids_to_delete:
        test_delete_conversation(ids_to_delete)
    else:
        print("INFO: No conversation IDs specified for deletion. Skipping delete test.")


    print("\n--- All Tests Finished ---")# 测试修改
