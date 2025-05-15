"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { PlusIcon, ArrowUpIcon, Square, Loader2 } from "lucide-react"
import { useChatWidth, useInputHeightReset } from "@lib/hooks"
import { useSupabaseAuth } from "@lib/supabase/hooks"; 
import { useCurrentAppStore } from "@lib/stores/current-app-store";
import { useChatLayoutStore } from "@lib/stores/chat-layout-store"
import { useChatInputStore } from "@lib/stores/chat-input-store"
import { useChatScrollStore } from "@lib/stores/chat-scroll-store"
import { useAttachmentStore } from "@lib/stores/attachment-store"
import { AttachmentPreviewBar } from "./attachment-preview-bar"
import { INITIAL_INPUT_HEIGHT } from "@lib/stores/chat-layout-store"
import { ChatButton } from "./button"
import { ChatTextInput } from "./text-input"
import { ChatContainer } from "./container"
import { ChatButtonArea, ChatTextArea } from "./layout"
import { create } from "zustand"
import { TooltipWrapper } from "@components/ui/tooltip-wrapper"
import { uploadDifyFile } from "@lib/services/dify/file-service"
import { DifyFileUploadResponse } from "@lib/services/dify/types"
import { AttachmentFile } from "@lib/stores/attachment-store"
import { useNotificationStore } from "@lib/stores/ui/notification-store"
import { FileTypeSelector } from "./file-type-selector"

// 创建一个全局焦点管理器
interface FocusManagerState {
  inputRef: React.RefObject<HTMLTextAreaElement> | null;
  registerRef: (ref: React.RefObject<HTMLTextAreaElement>) => void;
  focusInput: () => void;
}

// 使用Zustand存储输入框引用，确保跨组件共享
export const useFocusManager = create<FocusManagerState>((set, get) => ({
  inputRef: null,
  
  // 注册输入框引用
  registerRef: (ref) => {
    set({ inputRef: ref });
  },
  
  // 聚焦到输入框
  focusInput: () => {
    const { inputRef } = get();
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }
}));

// 主 ChatInput 组件
interface ChatInputProps {
  className?: string
  placeholder?: string
  maxHeight?: number
  onSubmit?: (message: string, files?: { type: string; transfer_method: string; upload_file_id: string; name: string; size: number; mime_type: string; }[]) => void
  onStop?: () => void
  isProcessing?: boolean
  isWaitingForResponse?: boolean
  isWaiting?: boolean
  // --- BEGIN COMMENT ---
  // 是否处于欢迎界面状态
  // --- END COMMENT ---
  isWelcomeScreen?: boolean
  // --- BEGIN COMMENT ---
  // 是否正在从对话界面过渡到欢迎界面
  // 当为 true 时，使用闪烁效果而不是滑动
  // --- END COMMENT ---
  isTransitioningToWelcome?: boolean
}

export const ChatInput = ({
  className,
  placeholder = "输入消息...",
  maxHeight = 300, // 定义输入框最大高度
  onSubmit,
  onStop,
  isProcessing = false,
  isWaitingForResponse = false,
  isWaiting = false,
  isWelcomeScreen: externalIsWelcomeScreen = false,
  isTransitioningToWelcome = false
}: ChatInputProps) => {
  const { widthClass } = useChatWidth()
  const { setInputHeight } = useChatLayoutStore()
  const {
    message, 
    setMessage, 
    clearMessage,
    isComposing, 
    setIsComposing,
    isWelcomeScreen,
    isDark
  } = useChatInputStore()
  
  // 附件状态
  const { files: attachments, addFiles, clearFiles: clearAttachments, updateFileStatus, updateFileUploadedId } = useAttachmentStore()
  // 本地状态，存储附件栏和文本框的各自高度
  const [attachmentBarHeight, setAttachmentBarHeight] = useState(0)
  const [textAreaHeight, setTextAreaHeight] = useState(INITIAL_INPUT_HEIGHT)
  
  // 使用高度重置钩子
  useInputHeightReset(isWelcomeScreen)
  
  // 创建输入框引用
  const inputRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) {
      // 将引用注册到全局焦点管理器
      const ref = { current: node } as React.RefObject<HTMLTextAreaElement>;
      useFocusManager.getState().registerRef(ref);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  // 从 store 获取当前的 inputHeight 以进行比较
  const currentLayoutInputHeight = useChatLayoutStore(state => state.inputHeight);

  // 回调函数，用于处理文本输入框高度变化
  const handleTextHeightChange = useCallback((newObservedHeight: number) => {
    const newCalculatedTextAreaHeight = Math.max(newObservedHeight, INITIAL_INPUT_HEIGHT);
    
    // 更新本地 textAreaHeight 状态 (setTextAreaHeight 会自动处理重复值)
    setTextAreaHeight(newCalculatedTextAreaHeight); 

    // 计算新的总输入高度
    // attachmentBarHeight 是 ChatInput 的本地状态，在 handleAttachmentBarHeightChange 中更新
    const newTotalInputHeight = newCalculatedTextAreaHeight + attachmentBarHeight; 
    
    // 只有当计算出的总高度与 store 中的当前总高度不同时，才更新 store
    if (currentLayoutInputHeight !== newTotalInputHeight) {
      setInputHeight(newTotalInputHeight);
    }
  }, [setInputHeight, attachmentBarHeight, currentLayoutInputHeight]); // textAreaHeight 从依赖中移除，因为它在内部通过 setTextAreaHeight 更新

  // 回调函数，用于处理附件预览栏高度变化
  const handleAttachmentBarHeightChange = useCallback((newAttachmentBarHeight: number) => {
    // 更新本地 attachmentBarHeight 状态 (setAttachmentBarHeight 会自动处理重复值)
    setAttachmentBarHeight(newAttachmentBarHeight);

    // 计算新的总输入高度
    // textAreaHeight 是 ChatInput 的本地状态
    const newTotalInputHeight = textAreaHeight + newAttachmentBarHeight;

    // 只有当计算出的总高度与 store 中的当前总高度不同时，才更新 store
    if (currentLayoutInputHeight !== newTotalInputHeight) {
      setInputHeight(newTotalInputHeight);
    }
  }, [setInputHeight, textAreaHeight, currentLayoutInputHeight]); // attachmentBarHeight 从依赖中移除

  // --- BEGIN 中文注释 --- 用户ID和应用ID信息 ---
  const { session } = useSupabaseAuth();
  const currentUserId = session?.user?.id;
  const { currentAppId, isLoadingAppId, errorLoadingAppId } = useCurrentAppStore();
  // --- END 中文注释 ---

  // --- BEGIN COMMENT ---
  // 处理用户未登录或AppId加载状态的副作用
  // --- END COMMENT ---
  useEffect(() => {
    if (!currentUserId && session !== undefined) { // session !== undefined 表示认证状态已确定
      console.log("ChatInput: User not logged in.");
      // TODO: 可以在此禁用输入框或提示用户登录
      // 例如: useNotificationStore.getState().showNotification("请先登录以发送消息", "warning");
    }
    if (isLoadingAppId) {
      console.log("ChatInput: App ID is loading...");
      // TODO: 可以在此设置一个加载状态，例如禁用输入框
    }
    if (errorLoadingAppId) {
      console.error("ChatInput: Error loading App ID:", errorLoadingAppId);
      // TODO: 可以在此显示错误提示给用户
      // 例如: useNotificationStore.getState().showNotification(`应用加载失败: ${errorLoadingAppId}`, "error");
    }
  }, [currentUserId, session, isLoadingAppId, errorLoadingAppId]);

  // 提交消息（实现乐观 UI：先清空，失败再恢复）
  const handleLocalSubmit = async () => {
    // --- BEGIN 中文注释 --- 状态暂存与恢复逻辑 ---
    let savedMessage = "";
    let savedAttachments: AttachmentFile[] = [];
    // --- END 中文注释 ---
    try {
      // 1. 暂存当前状态 (在清空和调用 onSubmit 前)
      savedMessage = message;
      savedAttachments = useAttachmentStore.getState().files;
      console.log("[ChatInput] 暂存状态", { savedMessage, savedAttachments });

      // 2. 过滤准备提交的文件 (使用暂存的状态)
      const uploadedFiles = savedAttachments.filter(f => f.status === 'success' && f.uploadedId);
      const files = uploadedFiles
        .filter(f => typeof f.uploadedId === 'string')
        .map(f => ({
          type: getDifyFileType(f),
          transfer_method: 'local_file',
          upload_file_id: f.uploadedId as string, // 明确断言为 string
          name: f.name,
          size: f.size,
          mime_type: f.type,
        }));
      const filesToSend = (Array.isArray(files) && files.length > 0) ? files : undefined;

      // 3. 检查是否可以提交 (使用暂存的消息)
      // --- BEGIN COMMENT ---
      // 在提交前，再次校验 userId 和 appId
      // --- END COMMENT ---
      if (!currentUserId) {
        console.error("ChatInput: Cannot submit, user not authenticated.");
        useNotificationStore.getState().showNotification("请先登录后再发送消息", "error");
        return; // 阻止提交
      }
      if (!currentAppId || isLoadingAppId) {
        console.error(`ChatInput: Cannot submit, App ID not ready (current: ${currentAppId}, loading: ${isLoadingAppId}).`);
        useNotificationStore.getState().showNotification(isLoadingAppId ? "应用正在加载，请稍候..." : "当前未选择应用，无法发送消息", "warning");
        return; // 阻止提交
      }

      if (savedMessage.trim() && onSubmit) {
        // --- BEGIN 中文注释 --- 乐观 UI：立即清空 ---
        clearMessage();
        clearAttachments();
        useChatScrollStore.getState().scrollToBottom('smooth'); // 滚动到底部
        // --- END 中文注释 ---
        
        // --- BEGIN 中文注释 --- 调用可能抛出错误的提交函数 (使用暂存的消息和组装好的文件)
        await onSubmit(savedMessage, filesToSend);
        // --- END 中文注释 ---
        
        // --- BEGIN 中文注释 --- 提交成功，无需额外操作，因为已提前清空 ---
        console.log("[ChatInput] 提交成功 (已提前清空)");
        // --- END 中文注释 ---
      } else {
        // 如果因为消息为空不能提交，理论上按钮已禁用，但以防万一
        console.log("[ChatInput] 没有可提交的消息内容。");
      }
    } catch (error) {
      // --- BEGIN 中文注释 --- 提交失败，恢复状态 ---
      console.error("[ChatInput] 消息提交失败，执行回滚", error);
      setMessage(savedMessage);
      useAttachmentStore.getState().setFiles(savedAttachments);
      // 调用通知 Store 显示错误消息
      useNotificationStore.getState().showNotification(
        `消息发送失败: ${(error as Error)?.message || '未知错误'}`,
        'error',
        3000 // 持续 3 秒
      );
      // --- END 中文注释 ---
    }
  };

  // --- 辅助函数：根据文件类型推断 Dify 文件 type 字段 ---
  function getDifyFileType(f: AttachmentFile): 'image' | 'document' | 'audio' | 'video' | 'custom' {
    const mime = f.type.toLowerCase();
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    if (mime === 'application/pdf' || mime.includes('word') || mime.includes('excel') || mime.includes('csv') || mime.includes('text') || mime.includes('html') || mime.includes('xml') || mime.includes('epub') || mime.includes('powerpoint')) return 'document';
    return 'custom';
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      
      // --- BEGIN 中文注释 ---
      // 在回车提交前，进行与按钮禁用逻辑完全一致的检查
      const shouldBlockSubmit = 
        isWaiting || // 正在等待响应
        isProcessing || // 正在处理上一条消息
        attachments.some(f => f.status === 'uploading') || // 有文件正在上传
        attachments.some(f => f.status === 'error') || // 有文件上传失败
        !message.trim(); // 消息为空
      // --- END 中文注释 ---

      if (!shouldBlockSubmit) {
        handleLocalSubmit();
      }
    }
  }

  // 处理输入法组合开始事件
  const handleCompositionStart = () => {
    setIsComposing(true)
  }

  // 处理输入法组合结束事件
  const handleCompositionEnd = () => {
    setIsComposing(false)
  }

  // 消息变化时自动聚焦，但避免在流式输出或输入法组合过程中触发
  useEffect(() => {
    // isComposing 状态从 store 中订阅，确保使用最新值
    const currentIsComposing = useChatInputStore.getState().isComposing; 
    if (message && !isProcessing && !isWaitingForResponse && !currentIsComposing) {
      useFocusManager.getState().focusInput();
    }
    // isComposing 状态本身的变化不应该触发这个 effect 来聚焦，
    // 而是当 message, isProcessing, isWaitingForResponse 变化时，再结合当时的 isComposing 来判断。
    // 如果将 isComposing 加入依赖数组，当 isComposing 从 true 变为 false 时，如果其他条件满足，也会聚焦，这可能是期望的。
    // 让我们先不加 isComposing 到依赖，看看效果。如果需要更精确控制，再调整。
  }, [message, isProcessing, isWaitingForResponse]);


  // --- BEGIN COMMENT ---
  // 组件首次挂载时自动聚焦输入框
  // --- END COMMENT ---
  useEffect(() => {
    // 确保在非欢迎屏幕（即实际聊天界面）时，或者即使用户要求任何时候都聚焦
    // 当前逻辑：只要组件挂载就尝试聚焦
    useFocusManager.getState().focusInput();
  }, []); // 空依赖数组确保只在挂载时运行一次
  
  // --- BEGIN 中文注释 --- 文件类型选择处理 ---
  // 处理文件类型选择后的文件上传
  const handleFileSelect = (files: FileList | null, accept: string) => {
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      addFiles(filesArray); // 添加到 Store

      // 对每个文件发起上传
      filesArray.forEach((file) => {
        const fileId = `${file.name}-${file.lastModified}-${file.size}`;
        updateFileStatus(fileId, 'uploading', 0); // 立即标记为上传中

        // 调用上传服务
        // --- BEGIN COMMENT ---
        // 确保 currentAppId 和 currentUserId 在调用时是有效的
        // --- END COMMENT ---
        if (!currentAppId || !currentUserId) {
          console.error("ChatInput: Cannot upload file, appId or userId is missing.");
          updateFileStatus(fileId, 'error', undefined, '应用或用户信息丢失，无法上传');
          return;
        }
        uploadDifyFile(currentAppId, file, currentUserId, (progress) => {
          // 更新进度
          updateFileStatus(fileId, 'uploading', progress);
        })
        .then((response) => {
          // 上传成功
          updateFileUploadedId(fileId, response.id);
          console.log(`[ChatInput] 文件上传成功: ${fileId} -> ${response.id}`);
        })
        .catch((error) => {
          // 上传失败
          updateFileStatus(fileId, 'error', undefined, error.message || '上传失败');
          console.error(`[ChatInput] 文件上传失败: ${fileId}`, error);
        });
      });
    }
  };
  // --- END 中文注释 ---
  
  // --- 重试上传逻辑 ---
  const handleRetryUpload = useCallback(async (fileId: string) => {
    console.log(`[ChatInput] Retrying upload for file ID: ${fileId}`);
    // 直接从 store state 获取文件
    const attachment = useAttachmentStore.getState().files.find(f => f.id === fileId);

    if (!attachment) {
      console.error(`[ChatInput] Cannot retry: Attachment with ID ${fileId} not found.`);
      useNotificationStore.getState().showNotification(`无法重试：未找到文件 ${fileId}`, 'error');
      return;
    }

    // 1. 重置状态为 uploading
    updateFileStatus(fileId, 'uploading', 0); 

    // 2. 重新调用上传服务
    try {
      // --- BEGIN COMMENT ---
      // 确保 currentAppId 和 currentUserId 在调用时是有效的
      // --- END COMMENT ---
      if (!currentAppId || !currentUserId) {
        console.error(`[ChatInput] Cannot retry upload for ${fileId}: appId or userId is missing.`);
        updateFileStatus(fileId, 'error', undefined, '应用或用户信息丢失，无法重试上传');
        useNotificationStore.getState().showNotification(`文件 ${attachment.name} 重试失败: 应用或用户信息丢失`, 'error');
        return;
      }
      const response = await uploadDifyFile(
        currentAppId, 
        attachment.file, // 使用原始 File 对象
        currentUserId, 
        (progress) => {
          // 更新进度回调
          updateFileStatus(fileId, 'uploading', progress);
        }
      );
      // 重试成功
      updateFileUploadedId(fileId, response.id);
      console.log(`[ChatInput] 重试上传成功: ${fileId} -> ${response.id}`);
    } catch (error) {
      // 重试失败，再次标记为 error
      updateFileStatus(fileId, 'error', undefined, (error as Error).message || '重试上传失败');
      console.error(`[ChatInput] 重试上传失败: ${fileId}`, error);
      useNotificationStore.getState().showNotification(
        `文件 ${attachment.name} 重试上传失败: ${(error as Error)?.message || '未知错误'}`,
        'error'
      );
    }
  }, [currentAppId, currentUserId, updateFileStatus, updateFileUploadedId]);

  // --- 计算按钮禁用状态 (依赖 store) ---
  const isUploading = attachments.some(f => f.status === 'uploading');
  const hasError = attachments.some(f => f.status === 'error');

  // --- BEGIN COMMENT ---
  // 优先使用外部传入的欢迎屏幕状态，如果没有则使用内部状态
  // 这样可以确保在页面组件中控制欢迎屏幕的显示状态
  // --- END COMMENT ---
  const effectiveIsWelcomeScreen = externalIsWelcomeScreen || isWelcomeScreen;
  
  return (
    <ChatContainer 
      isWelcomeScreen={effectiveIsWelcomeScreen} 
      isDark={isDark} 
      className={className} 
      widthClass={widthClass}
      isTransitioningToWelcome={isTransitioningToWelcome}
    >
      {/* 附件预览栏，仅当有附件时显示 */}
      <AttachmentPreviewBar
        isDark={isDark}
        onHeightChange={handleAttachmentBarHeightChange}
        onRetryUpload={handleRetryUpload}
      />

      {/* 文本区域 */}
      <ChatTextArea>
        <ChatTextInput
          ref={inputRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxHeight={maxHeight}
          isDark={isDark}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onHeightChange={handleTextHeightChange}
        />
      </ChatTextArea>

      {/* 按钮区域 */}
      <div className="px-4">
        <ChatButtonArea>
          <div className="flex-none">
            <FileTypeSelector
              onFileSelect={handleFileSelect}
              disabled={isUploading || isProcessing}
              ariaLabel="添加附件"
            />
          </div>
          <div className="flex-none">
            <ChatButton
              icon={
                isWaiting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isProcessing ? (
                  <Square className="h-5 w-5" />
                ) : (
                  <ArrowUpIcon className="h-5 w-5" />
                )
              }
              variant="submit"
              onClick={isWaiting ? undefined : (isProcessing ? onStop : handleLocalSubmit)}
              disabled={
                isWaiting ||
                isUploading ||
                hasError ||
                (!isProcessing && !message.trim())
              }
              isDark={isDark}
              ariaLabel={isProcessing ? "停止生成" : (isUploading ? "正在上传..." : (hasError ? "部分附件上传失败" : "发送消息"))}
              forceActiveStyle={isWaiting}
            />
          </div>
        </ChatButtonArea>
      </div>
    </ChatContainer>
  )
}
