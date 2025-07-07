'use client';

import { TooltipWrapper } from '@components/ui/tooltip-wrapper';
import { useChatWidth, useInputHeightReset } from '@lib/hooks';
import { useChatInputRouteSync } from '@lib/hooks/use-chat-input-route-sync';
import { useCurrentApp } from '@lib/hooks/use-current-app';
import { uploadDifyFile } from '@lib/services/dify/file-service';
import { DifyFileUploadResponse } from '@lib/services/dify/types';
import { useAppListStore } from '@lib/stores/app-list-store';
import { useAttachmentStore } from '@lib/stores/attachment-store';
import { AttachmentFile } from '@lib/stores/attachment-store';
import { useChatInputStore } from '@lib/stores/chat-input-store';
import { useChatLayoutStore } from '@lib/stores/chat-layout-store';
import { INITIAL_INPUT_HEIGHT } from '@lib/stores/chat-layout-store';
import { useChatScrollStore } from '@lib/stores/chat-scroll-store';
import { useNotificationStore } from '@lib/stores/ui/notification-store';
import { useSupabaseAuth } from '@lib/supabase/hooks';
import { cn } from '@lib/utils';
import { ArrowUpIcon, Loader2, PlusIcon, Square } from 'lucide-react';
import { create } from 'zustand';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { AttachmentPreviewBar } from './attachment-preview-bar';
import { ChatButton } from './button';
import { ChatContainer } from './container';
import { FileTypeSelector } from './file-type-selector';
import { ChatButtonArea, ChatTextArea } from './layout';
import { AppSelectorButton } from './model-selector-button';
import { ChatTextInput } from './text-input';

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
  registerRef: ref => {
    set({ inputRef: ref });
  },

  // 聚焦到输入框
  focusInput: () => {
    const { inputRef } = get();
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  },
}));

// 主 ChatInput 组件
interface ChatInputProps {
  className?: string;
  placeholder?: string;
  maxHeight?: number;
  onSubmit?: (
    message: string,
    files?: {
      type: string;
      transfer_method: string;
      upload_file_id: string;
      name: string;
      size: number;
      mime_type: string;
    }[]
  ) => void;
  onStop?: () => void;
  isProcessing?: boolean;
  isWaitingForResponse?: boolean;
  isWaiting?: boolean;
  // 是否处于欢迎界面状态
  isWelcomeScreen?: boolean;
  // 是否正在从对话界面过渡到欢迎界面
  // 当为 true 时，使用闪烁效果而不是滑动
  isTransitioningToWelcome?: boolean;
  // 🎯 新增：是否需要模型验证
  // 默认为true，在应用市场等不需要模型的场景可以设为false
  requireModelValidation?: boolean;
  // 🎯 新增：是否显示模型选择器
  // 默认为true，在某些场景下可能不需要显示
  showModelSelector?: boolean;
}

export const ChatInput = ({
  className,
  placeholder,
  maxHeight = 300, // 定义输入框最大高度
  onSubmit,
  onStop,
  isProcessing = false,
  isWaitingForResponse = false,
  isWaiting = false,
  isWelcomeScreen: externalIsWelcomeScreen = false,
  isTransitioningToWelcome = false,
  requireModelValidation = true,
  showModelSelector = true,
}: ChatInputProps) => {
  const t = useTranslations('pages.chat');
  const defaultPlaceholder = placeholder || t('input.placeholder');
  const { widthClass } = useChatWidth();
  const { setInputHeight } = useChatLayoutStore();
  const {
    message,
    setMessage,
    clearMessage,
    isComposing,
    setIsComposing,
    isWelcomeScreen,
    isDark,
  } = useChatInputStore();

  // 🎯 新增：本地提交状态，防止重复点击
  const [isLocalSubmitting, setIsLocalSubmitting] = useState(false);

  // 🎯 新增：按钮区域淡入动画状态
  const [showButtons, setShowButtons] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // 附件状态
  const {
    files: attachments,
    addFiles,
    clearFiles: clearAttachments,
    updateFileStatus,
    updateFileUploadedId,
  } = useAttachmentStore();
  // 本地状态，存储附件栏和文本框的各自高度
  const [attachmentBarHeight, setAttachmentBarHeight] = useState(0);
  const [textAreaHeight, setTextAreaHeight] = useState(INITIAL_INPUT_HEIGHT);

  // 使用高度重置钩子
  useInputHeightReset(isWelcomeScreen);

  // 🎯 新增：路由同步Hook，确保输入框内容按路由隔离
  useChatInputRouteSync();

  // 创建输入框引用
  const inputRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (node) {
      // 将引用注册到全局焦点管理器
      const ref = { current: node } as React.RefObject<HTMLTextAreaElement>;
      useFocusManager.getState().registerRef(ref);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  // 从 store 获取当前的 inputHeight 以进行比较
  const currentLayoutInputHeight = useChatLayoutStore(
    state => state.inputHeight
  );

  // 回调函数，用于处理文本输入框高度变化
  const handleTextHeightChange = useCallback(
    (newObservedHeight: number) => {
      const newCalculatedTextAreaHeight = Math.max(
        newObservedHeight,
        INITIAL_INPUT_HEIGHT
      );

      // 更新本地 textAreaHeight 状态 (setTextAreaHeight 会自动处理重复值)
      setTextAreaHeight(newCalculatedTextAreaHeight);

      // 计算新的总输入高度
      // attachmentBarHeight 是 ChatInput 的本地状态，在 handleAttachmentBarHeightChange 中更新
      const newTotalInputHeight =
        newCalculatedTextAreaHeight + attachmentBarHeight;

      // 只有当计算出的总高度与 store 中的当前总高度不同时，才更新 store
      if (currentLayoutInputHeight !== newTotalInputHeight) {
        setInputHeight(newTotalInputHeight);
      }
    },
    [setInputHeight, attachmentBarHeight, currentLayoutInputHeight]
  ); // textAreaHeight 从依赖中移除，因为它在内部通过 setTextAreaHeight 更新

  // 回调函数，用于处理附件预览栏高度变化
  const handleAttachmentBarHeightChange = useCallback(
    (newAttachmentBarHeight: number) => {
      // 更新本地 attachmentBarHeight 状态 (setAttachmentBarHeight 会自动处理重复值)
      setAttachmentBarHeight(newAttachmentBarHeight);

      // 计算新的总输入高度
      // textAreaHeight 是 ChatInput 的本地状态
      const newTotalInputHeight = textAreaHeight + newAttachmentBarHeight;

      // 只有当计算出的总高度与 store 中的当前总高度不同时，才更新 store
      if (currentLayoutInputHeight !== newTotalInputHeight) {
        setInputHeight(newTotalInputHeight);
      }
    },
    [setInputHeight, textAreaHeight, currentLayoutInputHeight]
  ); // attachmentBarHeight 从依赖中移除

  // User ID and App ID information
  const { session } = useSupabaseAuth();
  const activeUserId = session?.user?.id;
  const {
    currentAppId,
    isLoading: isLoadingAppId,
    isValidating: isValidatingAppConfig, // New: validation state
    isValidatingForMessage: isValidatingForMessageOnly, // New: validation state specifically for message sending
    error: errorLoadingAppId,
    hasCurrentApp,
    isReady: isAppReady,
  } = useCurrentApp();

  // Check if there are available models and if a valid model is selected
  // Only check when model validation is required
  const { apps } = useAppListStore();
  const availableModels = apps.filter(app => {
    const metadata = app.config?.app_metadata;
    return metadata?.app_type === 'model';
  });
  const hasAvailableModels = availableModels.length > 0;

  // Check if currently selected model is valid
  // Fix: Use instance_id for matching, as currentAppId stores instance_id not UUID
  const currentSelectedModel = availableModels.find(
    app => app.instance_id === currentAppId
  );
  const hasValidSelectedModel = !!currentSelectedModel;

  // Fix: Only check model status when model validation is required and model selector is shown
  // History conversations don't show model selector, so no model validation needed
  const canSubmitWithModel =
    !requireModelValidation ||
    !showModelSelector ||
    (hasAvailableModels && hasValidSelectedModel);

  // 🎯 修复：监听isWaiting状态变化来清空输入框
  // 当验证成功并开始等待响应时立即清空，而不是等待整个流式响应结束
  // 使用ref来避免在清空过程中重复触发
  const previousIsWaitingRef = useRef(isWaiting);

  useEffect(() => {
    // 只有当isWaiting从false变为true时才清空（验证成功并开始等待响应）
    if (isWaiting && !previousIsWaitingRef.current) {
      console.log('[ChatInput] 检测到isWaiting变为true，清空输入框');
      clearMessage();
      clearAttachments();
      useChatScrollStore.getState().scrollToBottom('smooth');
      // 🎯 重置本地提交状态，因为已进入等待响应状态
      setIsLocalSubmitting(false);
    }

    // 更新previous值
    previousIsWaitingRef.current = isWaiting;
  }, [isWaiting, clearMessage, clearAttachments]);

  // 提交消息（修复清空时机：通过监听isWaiting状态变化来清空）
  const handleLocalSubmit = async () => {
    // 🎯 防重复点击：如果已经在提交中，直接返回
    if (isLocalSubmitting) {
      console.log('[ChatInput] 检测到重复点击，忽略此次提交');
      return;
    }

    // State backup and restore logic
    let savedMessage = '';
    let savedAttachments: AttachmentFile[] = [];

    try {
      // 🎯 立即设置本地提交状态，防止重复点击
      setIsLocalSubmitting(true);

      // 1. 暂存当前状态 (在调用 onSubmit 前)
      savedMessage = message;
      savedAttachments = useAttachmentStore.getState().files;
      console.log('[ChatInput] 暂存状态', { savedMessage, savedAttachments });

      // 2. 过滤准备提交的文件 (使用暂存的状态)
      const uploadedFiles = savedAttachments.filter(
        f => f.status === 'success' && f.uploadedId
      );
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
      const filesToSend =
        Array.isArray(files) && files.length > 0 ? files : undefined;

      // 3. 检查是否可以提交 (使用暂存的消息)
      if (savedMessage.trim() && onSubmit) {
        // 🎯 修复：不再在这里清空，而是通过监听isWaiting状态变化来清空
        // 这样在验证成功后立即清空，而不是等待整个流式响应结束
        // Call submit function, clearing is handled by useEffect monitoring isWaiting state changes
        await onSubmit(savedMessage, filesToSend);

        // 🎯 修复：清空操作已移到useEffect中，这里不再需要
        console.log('[ChatInput] 提交成功');
      } else {
        // 如果因为消息为空不能提交，理论上按钮已禁用，但以防万一
        console.log('[ChatInput] 没有可提交的消息内容。');
      }
    } catch (error) {
      // Submit failed, restore state
      console.error(
        '[ChatInput] Message submission failed, executing rollback',
        error
      );
      // Fix: If validation failed (isWaiting didn't become true), need to restore state
      // If validation succeeded but subsequent failure, input has been cleared, also need to restore
      setMessage(savedMessage);
      useAttachmentStore.getState().setFiles(savedAttachments);
      // Call notification Store to show error message
      useNotificationStore.getState().showNotification(
        `${t('input.messageSendFailed')}: ${(error as Error)?.message || t('input.unknownError')}`,
        'error',
        3000 // Duration 3 seconds
      );
    } finally {
      // 🎯 无论成功还是失败，都重置本地提交状态
      setIsLocalSubmitting(false);
    }
  };

  // --- 辅助函数：根据文件类型推断 Dify 文件 type 字段 ---
  function getDifyFileType(
    f: AttachmentFile
  ): 'image' | 'document' | 'audio' | 'video' | 'custom' {
    const mime = f.type.toLowerCase();
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime.startsWith('video/')) return 'video';
    if (
      mime === 'application/pdf' ||
      mime.includes('word') ||
      mime.includes('excel') ||
      mime.includes('csv') ||
      mime.includes('text') ||
      mime.includes('html') ||
      mime.includes('xml') ||
      mime.includes('epub') ||
      mime.includes('powerpoint')
    )
      return 'document';
    return 'custom';
  }

  // 🎯 修复：在回车提交前，增加验证状态检查
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();

      // Before Enter submission, perform checks consistent with button disable logic
      const shouldBlockSubmit =
        isLocalSubmitting || // New: currently submitting locally
        isWaiting || // Waiting for response
        isValidatingAppConfig || // New: validating configuration
        isProcessing || // Processing previous message
        attachments.some(f => f.status === 'uploading') || // Files uploading
        attachments.some(f => f.status === 'error') || // File upload failed
        !message.trim() || // Message is empty
        !canSubmitWithModel; // New: no available models or no valid model selected

      if (!shouldBlockSubmit) {
        handleLocalSubmit();
      }
    }
  };

  // 处理输入法组合开始事件
  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  // 处理输入法组合结束事件
  const handleCompositionEnd = () => {
    setIsComposing(false);
  };

  // 消息变化时自动聚焦，但避免在流式输出或输入法组合过程中触发
  useEffect(() => {
    // isComposing 状态从 store 中订阅，确保使用最新值
    const currentIsComposing = useChatInputStore.getState().isComposing;
    if (
      message &&
      !isProcessing &&
      !isWaitingForResponse &&
      !currentIsComposing
    ) {
      useFocusManager.getState().focusInput();
    }
    // isComposing 状态本身的变化不应该触发这个 effect 来聚焦，
    // 而是当 message, isProcessing, isWaitingForResponse 变化时，再结合当时的 isComposing 来判断。
    // 如果将 isComposing 加入依赖数组，当 isComposing 从 true 变为 false 时，如果其他条件满足，也会聚焦，这可能是期望的。
    // 让我们先不加 isComposing 到依赖，看看效果。如果需要更精确控制，再调整。
  }, [message, isProcessing, isWaitingForResponse]);

  // 组件首次挂载时自动聚焦输入框
  useEffect(() => {
    // 确保在非欢迎屏幕（即实际聊天界面）时，或者即使用户要求任何时候都聚焦
    // 当前逻辑：只要组件挂载就尝试聚焦
    useFocusManager.getState().focusInput();
  }, []);

  // 监听欢迎界面状态变化，确保切换到新对话时自动聚焦
  // 这解决了从临时对话切换到新对话时焦点丢失的问题
  useEffect(() => {
    // 当切换到欢迎界面时（新对话），自动聚焦输入框
    // 添加短暂延迟确保界面过渡完成
    if (isWelcomeScreen) {
      const timer = setTimeout(() => {
        useFocusManager.getState().focusInput();
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [isWelcomeScreen]);

  // 监听外部传入的isWelcomeScreen prop变化
  // 确保当组件接收到新的欢迎界面状态时也能正确聚焦
  useEffect(() => {
    // 当外部传入的欢迎界面状态变为true时，自动聚焦输入框
    if (externalIsWelcomeScreen) {
      const timer = setTimeout(() => {
        useFocusManager.getState().focusInput();
      }, 150); // 150ms延迟，确保过渡动画完成

      return () => clearTimeout(timer);
    }
  }, [externalIsWelcomeScreen]);

  // File type selection handling
  // Handle file upload after file type selection
  const handleFileSelect = (files: FileList | null, accept: string) => {
    if (files && files.length > 0) {
      const filesArray = Array.from(files);
      addFiles(filesArray); // 添加到 Store

      // 对每个文件发起上传
      filesArray.forEach(file => {
        const fileId = `${file.name}-${file.lastModified}-${file.size}`;
        updateFileStatus(fileId, 'uploading', 0); // 立即标记为上传中

        // Call upload service
        // Use current appId for upload, use default if not available
        const appIdToUse = currentAppId || 'chat-input-warning-no-app-id';
        const userIdToUse =
          session?.user?.id || 'chat-input-warning-no-user-id'; // Use anonymous user ID

        uploadDifyFile(appIdToUse, file, userIdToUse, progress => {
          // Update progress
          updateFileStatus(fileId, 'uploading', progress);
        })
          .then(response => {
            // Upload successful
            updateFileUploadedId(fileId, response.id);
            console.log(
              `[ChatInput] File upload successful: ${fileId} -> ${response.id}`
            );
          })
          .catch(error => {
            // Upload failed
            updateFileStatus(
              fileId,
              'error',
              undefined,
              error.message || t('input.uploadFailed')
            );
            console.error(`[ChatInput] File upload failed: ${fileId}`, error);
          });
      });
    }
  };

  // --- 重试上传逻辑 ---
  const handleRetryUpload = useCallback(
    async (fileId: string) => {
      console.log(`[ChatInput] Retrying upload for file ID: ${fileId}`);
      // 直接从 store state 获取文件
      const attachment = useAttachmentStore
        .getState()
        .files.find(f => f.id === fileId);

      if (!attachment) {
        console.error(
          `[ChatInput] Cannot retry: Attachment with ID ${fileId} not found.`
        );
        useNotificationStore
          .getState()
          .showNotification(
            `${t('input.retryUpload')}: ${t('input.fileUploadError')} ${fileId}`,
            'error'
          );
        return;
      }

      // 1. 重置状态为 uploading
      updateFileStatus(fileId, 'uploading', 0);

      // 2. 重新调用上传服务
      try {
        // 使用当前的 appId 进行上传，如果没有则使用默认值
        const appIdToUse = currentAppId || 'chat-input-warning-no-app-id';
        const userIdToUse =
          session?.user?.id || 'chat-input-warning-no-user-id'; // 使用匿名用户ID

        const response = await uploadDifyFile(
          appIdToUse,
          attachment.file, // 使用原始 File 对象
          userIdToUse,
          progress => {
            // 更新进度回调
            updateFileStatus(fileId, 'uploading', progress);
          }
        );
        // 重试成功
        updateFileUploadedId(fileId, response.id);
        console.log(`[ChatInput] 重试上传成功: ${fileId} -> ${response.id}`);
      } catch (error) {
        // 重试失败，再次标记为 error
        updateFileStatus(
          fileId,
          'error',
          undefined,
          (error as Error).message || t('input.retryUpload')
        );
        console.error(`[ChatInput] 重试上传失败: ${fileId}`, error);
        useNotificationStore
          .getState()
          .showNotification(
            `${t('input.fileUploadError')} ${attachment.name}: ${(error as Error)?.message || t('input.unknownError')}`,
            'error'
          );
      }
    },
    [currentAppId, updateFileStatus, updateFileUploadedId, session?.user?.id]
  );

  // --- 计算按钮禁用状态 (依赖 store) ---
  const isUploading = attachments.some(f => f.status === 'uploading');
  const hasError = attachments.some(f => f.status === 'error');

  // 🎯 修改：只有消息发送时的验证才显示spinner
  // 应用切换时的验证不影响输入框状态
  const isValidatingConfig = isValidatingForMessageOnly;

  // 优先使用外部传入的欢迎屏幕状态，如果没有则使用内部状态
  // 这样可以确保在页面组件中控制欢迎屏幕的显示状态
  const effectiveIsWelcomeScreen = externalIsWelcomeScreen || isWelcomeScreen;

  // 🎯 按钮淡入动画控制逻辑 - 更快的动画速度
  useEffect(() => {
    // 首次挂载时，快速显示按钮
    if (isInitialMount) {
      const mountTimer = setTimeout(() => {
        setShowButtons(true);
        setIsInitialMount(false);
      }, 50);
      return () => clearTimeout(mountTimer);
    }

    // 处理状态变化的动画
    if (effectiveIsWelcomeScreen || isTransitioningToWelcome) {
      // 转换到欢迎界面时：先隐藏再快速显示
      setShowButtons(false);
      const welcomeTimer = setTimeout(() => {
        setShowButtons(true);
      }, 80);
      return () => clearTimeout(welcomeTimer);
    } else {
      // 其他状态变化时立即显示
      setShowButtons(true);
    }
  }, [effectiveIsWelcomeScreen, isTransitioningToWelcome, isInitialMount]);

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
          placeholder={defaultPlaceholder}
          maxHeight={maxHeight}
          isDark={isDark}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onHeightChange={handleTextHeightChange}
        />
      </ChatTextArea>

      {/* 按钮区域 - 🎯 添加淡入动画 */}
      <div className="px-4">
        <ChatButtonArea>
          {/* 🎯 文件附件按钮 - 从中心缩放淡入 */}
          <div
            className={cn(
              'flex-none transition-all duration-250 ease-out',
              showButtons ? 'scale-100 opacity-100' : 'scale-80 opacity-0'
            )}
            style={{ transitionDelay: showButtons ? '0ms' : '0ms' }}
          >
            <FileTypeSelector
              onFileSelect={handleFileSelect}
              disabled={isUploading || isProcessing}
              ariaLabel={t('input.addAttachment')}
            />
          </div>

          {/* Middle area: App selector button, can extend left - 🎯 带分层缩放淡入动画 */}
          <div className="flex flex-1 items-center justify-end space-x-2">
            {/* 🎯 模型选择器按钮 - 从中心缩放淡入 */}
            {showModelSelector && (
              <div
                className={cn(
                  'transition-all duration-250 ease-out',
                  showButtons ? 'scale-100 opacity-100' : 'scale-80 opacity-0'
                )}
                style={{ transitionDelay: showButtons ? '60ms' : '0ms' }}
              >
                <AppSelectorButton />
              </div>
            )}

            {/* 🎯 发送按钮 - 从中心缩放淡入 */}
            <div
              className={cn(
                'transition-all duration-250 ease-out',
                showButtons ? 'scale-100 opacity-100' : 'scale-80 opacity-0'
              )}
              style={{ transitionDelay: showButtons ? '120ms' : '0ms' }}
            >
              <ChatButton
                icon={
                  isLocalSubmitting || isWaiting || isValidatingConfig ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isProcessing ? (
                    <Square className="h-5 w-5" />
                  ) : (
                    <ArrowUpIcon className="h-5 w-5" />
                  )
                }
                variant="submit"
                onClick={
                  isLocalSubmitting || isWaiting || isValidatingConfig
                    ? undefined
                    : isProcessing
                      ? onStop
                      : handleLocalSubmit
                }
                disabled={
                  isLocalSubmitting || // 🎯 新增：本地提交期间禁用按钮
                  isWaiting ||
                  isValidatingConfig || // 🎯 新增：验证期间禁用按钮
                  isUploading ||
                  hasError ||
                  (!isProcessing && !message.trim()) ||
                  !canSubmitWithModel
                }
                isDark={isDark}
                ariaLabel={
                  isLocalSubmitting
                    ? t('input.sending')
                    : isValidatingConfig
                      ? t('input.validatingConfig')
                      : isProcessing
                        ? t('input.stopGeneration')
                        : isUploading
                          ? t('input.uploading')
                          : hasError
                            ? t('input.uploadFailed')
                            : !canSubmitWithModel
                              ? requireModelValidation
                                ? !hasAvailableModels
                                  ? t('input.noModelAvailable')
                                  : t('input.pleaseSelectModel')
                                : t('input.cannotSubmit')
                              : t('input.sendMessage')
                }
                forceActiveStyle={
                  isLocalSubmitting || isWaiting || isValidatingConfig
                }
              />
            </div>
          </div>
        </ChatButtonArea>
      </div>
    </ChatContainer>
  );
};
