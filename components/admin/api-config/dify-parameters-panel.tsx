'use client';

import { FILE_TYPE_CONFIG } from '@lib/constants/file-types';
import { useTheme } from '@lib/hooks/use-theme';
import type { DifyParametersSimplifiedConfig } from '@lib/types/dify-parameters';
import { cn } from '@lib/utils';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FormInput,
  MessageSquare,
  Mic,
  Plus,
  RotateCcw,
  Save,
  Settings2,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  Volume2,
  X,
} from 'lucide-react';

import React, { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

interface DifyParametersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: DifyParametersSimplifiedConfig;
  onSave: (config: DifyParametersSimplifiedConfig) => void;
  instanceName?: string;
}

const DifyParametersPanel: React.FC<DifyParametersPanelProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  instanceName = 'this app',
}) => {
  const { isDark } = useTheme();
  const t = useTranslations('pages.admin.apiConfig.difyParametersPanel');
  const [localConfig, setLocalConfig] =
    useState<DifyParametersSimplifiedConfig>(config);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- File upload configuration state ---
  const [fileUploadEnabled, setFileUploadEnabled] = useState(false);
  const [showFileUploadModal, setShowFileUploadModal] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'local' | 'url' | 'both'>(
    'both'
  );
  const [maxFiles, setMaxFiles] = useState(3);
  const [enabledFileTypes, setEnabledFileTypes] = useState<Set<string>>(
    new Set(['image'])
  );
  const [customFileTypes, setCustomFileTypes] = useState<string>(''); // custom file types

  // --- Initial state for cancel operation ---
  const [initialFileUploadState, setInitialFileUploadState] = useState({
    fileUploadEnabled: false,
    uploadMethod: 'both' as 'local' | 'url' | 'both',
    maxFiles: 3,
    enabledFileTypes: new Set<string>(['image']),
    customFileTypes: '',
  });

  useEffect(() => {
    setLocalConfig(config);
    setHasChanges(false);
    setIsInitialized(false);

    // Initialize default configuration values
    const initializeConfig = () => {
      const initializedConfig: DifyParametersSimplifiedConfig = {
        opening_statement: config.opening_statement || '',
        suggested_questions: config.suggested_questions || [],
        suggested_questions_after_answer:
          config.suggested_questions_after_answer || { enabled: false },
        speech_to_text: config.speech_to_text || { enabled: false },
        text_to_speech: config.text_to_speech || { enabled: false },
        retriever_resource: config.retriever_resource || { enabled: false },
        annotation_reply: config.annotation_reply || { enabled: false },
        user_input_form: config.user_input_form || [],
        // Preserve file_upload config from Dify API
        file_upload: config.file_upload,
        system_parameters: config.system_parameters || {
          file_size_limit: 15,
          image_file_size_limit: 10,
          audio_file_size_limit: 50,
          video_file_size_limit: 100,
        },
      };

      setLocalConfig(initializedConfig);
      setTimeout(() => setIsInitialized(true), 100);
    };

    initializeConfig();

    // Initialize file upload state
    const initializeFileUploadState = () => {
      const fileUploadConfig = config.file_upload;

      // Detect file upload enabled state from Dify API format
      const hasFileUpload = !!(
        fileUploadConfig?.enabled || // Check the top-level enabled field
        fileUploadConfig?.image?.enabled || // Compatible with standard format
        fileUploadConfig?.document?.enabled ||
        fileUploadConfig?.audio?.enabled ||
        fileUploadConfig?.video?.enabled ||
        fileUploadConfig?.other?.enabled
      );

      console.log(
        '[File upload initialization] Detected file upload enabled state:',
        hasFileUpload
      );

      let uploadMethodValue: 'local' | 'url' | 'both' = 'both';
      let maxFilesValue = 3;
      const enabledTypesSet = new Set<string>();
      let customFileTypesValue = '';

      if (hasFileUpload && fileUploadConfig) {
        // Get config from Dify API format
        let configSource = null;
        if (fileUploadConfig.allowed_file_upload_methods) {
          // Use top-level configuration
          const methods = fileUploadConfig.allowed_file_upload_methods || [];
          if (
            methods.includes('local_file') &&
            methods.includes('remote_url')
          ) {
            uploadMethodValue = 'both';
          } else if (methods.includes('local_file')) {
            uploadMethodValue = 'local';
          } else if (methods.includes('remote_url')) {
            uploadMethodValue = 'url';
          }

          // Get file number limit
          maxFilesValue =
            fileUploadConfig.number_limits ||
            fileUploadConfig.max_files ||
            fileUploadConfig.file_count_limit ||
            3; // Default value
        } else {
          // Fall back to specific file type configuration
          configSource =
            fileUploadConfig.image ||
            fileUploadConfig.document ||
            fileUploadConfig.audio ||
            fileUploadConfig.video ||
            fileUploadConfig.other;

          if (configSource) {
            maxFilesValue = configSource.number_limits || 3;
            const methods = configSource.transfer_methods || [];
            if (
              methods.includes('local_file') &&
              methods.includes('remote_url')
            ) {
              uploadMethodValue = 'both';
            } else if (methods.includes('local_file')) {
              uploadMethodValue = 'local';
            } else if (methods.includes('remote_url')) {
              uploadMethodValue = 'url';
            }
          }
        }

        // Set enabled file types from API response
        if (fileUploadConfig.allowed_file_types) {
          // Get the enabled file types from the allowed_file_types field
          const allowedTypes = fileUploadConfig.allowed_file_types;

          // Check if it contains standard types
          const hasStandardTypes = allowedTypes.some(type =>
            ['image', 'document', 'audio', 'video'].includes(type)
          );

          if (hasStandardTypes) {
            // If there are standard types, only add standard types
            if (allowedTypes.includes('image')) enabledTypesSet.add('image');
            if (allowedTypes.includes('document'))
              enabledTypesSet.add('document');
            if (allowedTypes.includes('audio')) enabledTypesSet.add('audio');
            if (allowedTypes.includes('video')) enabledTypesSet.add('video');
          } else if (allowedTypes.includes('custom')) {
            // If it contains custom, it means "Other file types" is selected
            enabledTypesSet.add('other');
            // Get the custom extensions from the allowed_file_extensions field
            if (fileUploadConfig.allowed_file_extensions) {
              customFileTypesValue =
                fileUploadConfig.allowed_file_extensions.join(', ');
            }
          } else {
            // If there are no standard types and no custom, it may be other unknown types
            console.warn(
              '[File upload initialization] Unknown file types:',
              allowedTypes
            );
            enabledTypesSet.add('other');
          }
        } else {
          // Fall back to checking the specific file type configuration
          if (fileUploadConfig.image?.enabled) enabledTypesSet.add('image');
          if (fileUploadConfig.document?.enabled)
            enabledTypesSet.add('document');
          if (fileUploadConfig.audio?.enabled) enabledTypesSet.add('audio');
          if (fileUploadConfig.video?.enabled) enabledTypesSet.add('video');
          if (fileUploadConfig.other?.enabled) {
            enabledTypesSet.add('other');
            customFileTypesValue =
              (
                fileUploadConfig.other as { custom_extensions?: string[] }
              ).custom_extensions?.join(', ') || '';
          }
        }
      }

      // Keep empty set when no types enabled

      const newState = {
        fileUploadEnabled: hasFileUpload,
        uploadMethod: uploadMethodValue,
        maxFiles: maxFilesValue,
        enabledFileTypes: enabledTypesSet,
        customFileTypes: customFileTypesValue,
      };

      // Update current state
      setFileUploadEnabled(newState.fileUploadEnabled);
      setUploadMethod(newState.uploadMethod);
      setMaxFiles(newState.maxFiles);
      setEnabledFileTypes(newState.enabledFileTypes);
      setCustomFileTypes(newState.customFileTypes);

      // Save initial state
      setInitialFileUploadState(newState);
    };

    initializeFileUploadState();
  }, [config]);

  useEffect(() => {
    if (isInitialized) {
      const configChanged =
        JSON.stringify(localConfig) !== JSON.stringify(config);
      setHasChanges(configChanged);
    }
  }, [localConfig, config, isInitialized]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const updateConfig = (path: string, value: unknown) => {
    setLocalConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newConfig as Record<
        string,
        unknown
      >;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const addSuggestedQuestion = () => {
    const questions = localConfig.suggested_questions || [];
    updateConfig('suggested_questions', [...questions, '']);
  };

  const updateSuggestedQuestion = (index: number, value: string) => {
    const questions = localConfig.suggested_questions || [];
    const newQuestions = [...questions];
    newQuestions[index] = value;
    updateConfig('suggested_questions', newQuestions);
  };

  const removeSuggestedQuestion = (index: number) => {
    const questions = localConfig.suggested_questions || [];
    const newQuestions = questions.filter((_, i) => i !== index);
    updateConfig('suggested_questions', newQuestions);
  };

  const handleSave = () => {
    onSave(localConfig);
    setHasChanges(false);

    // Update the initial state
    setInitialFileUploadState({
      fileUploadEnabled,
      uploadMethod,
      maxFiles,
      enabledFileTypes: new Set(enabledFileTypes),
      customFileTypes,
    });
  };

  const handleReset = () => {
    setLocalConfig(config);
    setHasChanges(false);

    // Restore the file upload state to the initial state
    setFileUploadEnabled(initialFileUploadState.fileUploadEnabled);
    setUploadMethod(initialFileUploadState.uploadMethod);
    setMaxFiles(initialFileUploadState.maxFiles);
    setEnabledFileTypes(new Set(initialFileUploadState.enabledFileTypes));
    setCustomFileTypes(initialFileUploadState.customFileTypes);
  };

  const toggleFileType = (fileType: string) => {
    const newEnabledTypes = new Set(enabledFileTypes);
    if (newEnabledTypes.has(fileType)) {
      newEnabledTypes.delete(fileType);
    } else {
      newEnabledTypes.add(fileType);
    }
    setEnabledFileTypes(newEnabledTypes);
  };

  const handleFileUploadToggle = (enabled: boolean) => {
    setFileUploadEnabled(enabled);
    if (!enabled) {
      // When closing, clear the local configuration, but keep the form state for the user to reconfigure
      updateConfig('file_upload', undefined);
    } else {
      // When opening, generate the configuration based on the current form state
      generateFileUploadConfig();
    }
  };

  const generateFileUploadConfig = () => {
    // Generate configuration from form state
    const fileUploadConfig: Record<
      string,
      {
        enabled: boolean;
        number_limits: number;
        transfer_methods: string[];
        custom_extensions?: string[];
      }
    > = {};

    const transferMethods =
      uploadMethod === 'local'
        ? ['local_file']
        : uploadMethod === 'url'
          ? ['remote_url']
          : ['local_file', 'remote_url'];

    if (enabledFileTypes.has('image')) {
      fileUploadConfig.image = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
      };
    }

    if (enabledFileTypes.has('document')) {
      fileUploadConfig.document = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
      };
    }

    if (enabledFileTypes.has('audio')) {
      fileUploadConfig.audio = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
      };
    }

    if (enabledFileTypes.has('video')) {
      fileUploadConfig.video = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
      };
    }

    if (enabledFileTypes.has('other') && customFileTypes.trim()) {
      fileUploadConfig.other = {
        enabled: true,
        number_limits: maxFiles,
        transfer_methods: transferMethods,
        custom_extensions: customFileTypes
          .split(/[,\s]+/)
          .filter(ext => ext.trim()),
      };
    }

    updateConfig(
      'file_upload',
      Object.keys(fileUploadConfig).length > 0 ? fileUploadConfig : undefined
    );
  };

  const openFileUploadModal = () => {
    if (fileUploadEnabled) {
      setShowFileUploadModal(true);
    }
  };

  const handleFileUploadSave = () => {
    generateFileUploadConfig();
    setShowFileUploadModal(false);
  };

  const handleFileUploadCancel = () => {
    // Restore state before modal opened
    setShowFileUploadModal(false);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Background overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 cursor-pointer transition-opacity duration-300',
          'bg-black/20 backdrop-blur-sm',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-[520px]',
          'transform transition-transform duration-300 ease-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Modal container */}
        <div className="flex h-full flex-col p-4">
          <div
            className={cn(
              'mt-4 mb-4 flex max-h-[calc(100vh-8rem)] flex-1 flex-col',
              'rounded-2xl border shadow-2xl',
              isDark
                ? 'border-stone-700 bg-stone-900'
                : 'border-stone-200 bg-white'
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'flex flex-shrink-0 items-center justify-between border-b p-6',
                isDark ? 'border-stone-700' : 'border-stone-200'
              )}
            >
              {/* Title */}
              <h2
                className={cn(
                  'font-serif text-xl font-bold',
                  isDark ? 'text-stone-100' : 'text-stone-900'
                )}
              >
                {t('title', { instanceName })}
              </h2>

              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  'cursor-pointer rounded-lg p-2 transition-colors',
                  isDark
                    ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-300'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-700'
                )}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content area */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="space-y-6 p-6 pb-8">
                {/* Opening statement config */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('basic')}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors',
                      isDark
                        ? 'bg-stone-800 hover:bg-stone-700'
                        : 'bg-stone-50 hover:bg-stone-100'
                    )}
                  >
                    <MessageSquare
                      className={cn(
                        'h-4 w-4',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 text-left font-serif font-medium',
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      )}
                    >
                      {t('sections.basic.title')}
                    </span>
                    {expandedSections.has('basic') ? (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        )}
                      />
                    ) : (
                      <ChevronRight
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-500'
                        )}
                      />
                    )}
                  </button>

                  {expandedSections.has('basic') && (
                    <div
                      className={cn(
                        'space-y-4 rounded-xl border p-4',
                        isDark
                          ? 'border-stone-700 bg-stone-800/50'
                          : 'border-stone-200 bg-stone-50/50'
                      )}
                    >
                      {/* Opening statement */}
                      <div>
                        <label
                          className={cn(
                            'mb-2 block font-serif text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          {t('sections.basic.openingStatement.label')}
                        </label>
                        <textarea
                          value={localConfig.opening_statement || ''}
                          onChange={e =>
                            updateConfig('opening_statement', e.target.value)
                          }
                          className={cn(
                            'w-full resize-none rounded-lg border px-3 py-2 font-serif',
                            isDark
                              ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                              : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                          )}
                          placeholder={t(
                            'sections.basic.openingStatement.placeholder'
                          )}
                          rows={3}
                        />
                      </div>

                      {/* Suggested questions */}
                      <div>
                        <label
                          className={cn(
                            'mb-2 block font-serif text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          {t('sections.basic.suggestedQuestions.label')}
                        </label>
                        <div className="space-y-3">
                          {(localConfig.suggested_questions || []).map(
                            (question, index) => (
                              <div key={index} className="flex gap-2">
                                <input
                                  type="text"
                                  value={question}
                                  onChange={e =>
                                    updateSuggestedQuestion(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className={cn(
                                    'flex-1 rounded-lg border px-3 py-2 font-serif',
                                    isDark
                                      ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                                      : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                                  )}
                                  placeholder={t(
                                    'sections.basic.suggestedQuestions.placeholder'
                                  )}
                                />
                                <button
                                  onClick={() => removeSuggestedQuestion(index)}
                                  className={cn(
                                    'cursor-pointer rounded-lg p-2 transition-colors',
                                    isDark
                                      ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                                      : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                                  )}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            )
                          )}

                          <button
                            onClick={addSuggestedQuestion}
                            className={cn(
                              'w-full cursor-pointer rounded-lg border border-dashed px-3 py-2 transition-colors',
                              'flex items-center justify-center gap-2 font-serif text-sm',
                              isDark
                                ? 'border-stone-600 text-stone-400 hover:border-stone-500 hover:text-stone-300'
                                : 'border-stone-300 text-stone-600 hover:border-stone-400 hover:text-stone-700'
                            )}
                          >
                            <Plus className="h-4 w-4" />
                            {t('sections.basic.suggestedQuestions.addButton')}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Post-answer suggestions */}
                <div className="space-y-4">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4',
                      isDark ? 'bg-stone-800' : 'bg-stone-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      />
                      <span
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        )}
                      >
                        {t('sections.basic.suggestedQuestions.label')}
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={
                          localConfig.suggested_questions_after_answer
                            ?.enabled || false
                        }
                        onChange={e =>
                          updateConfig(
                            'suggested_questions_after_answer.enabled',
                            e.target.checked
                          )
                        }
                        className="peer sr-only"
                      />
                      <div
                        className={cn(
                          'peer relative h-6 w-11 rounded-full transition-colors',
                          'peer-focus:ring-2',
                          localConfig.suggested_questions_after_answer?.enabled
                            ? isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-700 peer-focus:ring-stone-300'
                            : isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-300 peer-focus:ring-stone-300'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                            localConfig.suggested_questions_after_answer
                              ?.enabled
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          )}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* File upload config */}
                <div className="space-y-4">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4',
                      isDark ? 'bg-stone-800' : 'bg-stone-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Upload
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      />
                      <span
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        )}
                      >
                        {t('sections.fileUpload.title')}
                      </span>
                    </div>
                    <div className="flex h-6 items-center gap-3">
                      {' '}
                      {/* Fixed height to prevent changes */}
                      {fileUploadEnabled && (
                        <button
                          onClick={openFileUploadModal}
                          className={cn(
                            'cursor-pointer rounded-lg p-2 transition-colors',
                            isDark
                              ? 'text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                              : 'text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                          )}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      )}
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={fileUploadEnabled}
                          onChange={e =>
                            handleFileUploadToggle(e.target.checked)
                          }
                          className="peer sr-only"
                        />
                        <div
                          className={cn(
                            'peer relative h-6 w-11 rounded-full transition-colors',
                            'peer-focus:ring-2',
                            fileUploadEnabled
                              ? isDark
                                ? 'bg-stone-600 peer-focus:ring-stone-500'
                                : 'bg-stone-700 peer-focus:ring-stone-300'
                              : isDark
                                ? 'bg-stone-600 peer-focus:ring-stone-500'
                                : 'bg-stone-300 peer-focus:ring-stone-300'
                          )}
                        >
                          <div
                            className={cn(
                              'absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                              fileUploadEnabled
                                ? 'translate-x-5'
                                : 'translate-x-0'
                            )}
                          />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Speech-to-text config */}
                <div className="space-y-4">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4',
                      isDark ? 'bg-stone-800' : 'bg-stone-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Mic
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      />
                      <span
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        )}
                      >
                        {t('sections.speechToText.title')}
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.speech_to_text?.enabled || false}
                        onChange={e =>
                          updateConfig(
                            'speech_to_text.enabled',
                            e.target.checked
                          )
                        }
                        className="peer sr-only"
                      />
                      <div
                        className={cn(
                          'peer relative h-6 w-11 rounded-full transition-colors',
                          'peer-focus:ring-2',
                          localConfig.speech_to_text?.enabled
                            ? isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-700 peer-focus:ring-stone-300'
                            : isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-300 peer-focus:ring-stone-300'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                            localConfig.speech_to_text?.enabled
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          )}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Text-to-speech config */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('tts')}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors',
                      isDark
                        ? 'bg-stone-800 hover:bg-stone-700'
                        : 'bg-stone-50 hover:bg-stone-100'
                    )}
                  >
                    <Volume2
                      className={cn(
                        'h-4 w-4',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 text-left font-serif font-medium',
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      )}
                    >
                      {t('sections.textToSpeech.title')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-serif text-xs',
                          localConfig.text_to_speech?.enabled
                            ? isDark
                              ? 'text-green-400'
                              : 'text-green-600'
                            : isDark
                              ? 'text-stone-500'
                              : 'text-stone-400'
                        )}
                      >
                        {localConfig.text_to_speech?.enabled
                          ? t('sections.textToSpeech.enabled')
                          : t('sections.textToSpeech.disabled')}
                      </span>
                      {expandedSections.has('tts') ? (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {expandedSections.has('tts') && (
                    <div
                      className={cn(
                        'space-y-4 rounded-xl border p-4',
                        isDark
                          ? 'border-stone-700 bg-stone-800/50'
                          : 'border-stone-200 bg-stone-50/50'
                      )}
                    >
                      {/* Enable switch */}
                      <div className="flex items-center justify-between">
                        <label
                          className={cn(
                            'font-serif text-sm font-medium',
                            isDark ? 'text-stone-300' : 'text-stone-700'
                          )}
                        >
                          {t('sections.textToSpeech.enableLabel')}
                        </label>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={
                              localConfig.text_to_speech?.enabled || false
                            }
                            onChange={e =>
                              updateConfig(
                                'text_to_speech.enabled',
                                e.target.checked
                              )
                            }
                            className="peer sr-only"
                          />
                          <div
                            className={cn(
                              'peer relative h-6 w-11 rounded-full transition-colors',
                              'peer-focus:ring-2',
                              localConfig.text_to_speech?.enabled
                                ? isDark
                                  ? 'bg-stone-600 peer-focus:ring-stone-500'
                                  : 'bg-stone-700 peer-focus:ring-stone-300'
                                : isDark
                                  ? 'bg-stone-600 peer-focus:ring-stone-500'
                                  : 'bg-stone-300 peer-focus:ring-stone-300'
                            )}
                          >
                            <div
                              className={cn(
                                'absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                                localConfig.text_to_speech?.enabled
                                  ? 'translate-x-5'
                                  : 'translate-x-0'
                              )}
                            />
                          </div>
                        </label>
                      </div>

                      {/* Voice type */}
                      {localConfig.text_to_speech?.enabled && (
                        <>
                          <div>
                            <label
                              className={cn(
                                'mb-2 block font-serif text-sm font-medium',
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              )}
                            >
                              {t('sections.textToSpeech.voiceType.label')}
                            </label>
                            <input
                              type="text"
                              value={localConfig.text_to_speech?.voice || ''}
                              onChange={e =>
                                updateConfig(
                                  'text_to_speech.voice',
                                  e.target.value
                                )
                              }
                              className={cn(
                                'w-full rounded-lg border px-3 py-2 font-serif',
                                isDark
                                  ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                                  : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                              )}
                              placeholder={t(
                                'sections.textToSpeech.voiceType.placeholder'
                              )}
                            />
                          </div>

                          {/* Language */}
                          <div>
                            <label
                              className={cn(
                                'mb-2 block font-serif text-sm font-medium',
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              )}
                            >
                              {t('sections.textToSpeech.language.label')}
                            </label>
                            <select
                              value={localConfig.text_to_speech?.language || ''}
                              onChange={e =>
                                updateConfig(
                                  'text_to_speech.language',
                                  e.target.value
                                )
                              }
                              className={cn(
                                'w-full rounded-lg border px-3 py-2 font-serif',
                                isDark
                                  ? 'border-stone-600 bg-stone-700 text-stone-100'
                                  : 'border-stone-300 bg-white text-stone-900'
                              )}
                            >
                              <option value="">
                                {t(
                                  'sections.textToSpeech.language.selectPlaceholder'
                                )}
                              </option>
                              <option value="zh">
                                {t('sections.textToSpeech.language.options.zh')}
                              </option>
                              <option value="en">
                                {t('sections.textToSpeech.language.options.en')}
                              </option>
                              <option value="ja">
                                {t('sections.textToSpeech.language.options.ja')}
                              </option>
                              <option value="ko">
                                {t('sections.textToSpeech.language.options.ko')}
                              </option>
                            </select>
                          </div>

                          {/* Auto play */}
                          <div>
                            <label
                              className={cn(
                                'mb-2 block font-serif text-sm font-medium',
                                isDark ? 'text-stone-300' : 'text-stone-700'
                              )}
                            >
                              {t('sections.textToSpeech.autoPlay.label')}
                            </label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateConfig(
                                    'text_to_speech.autoPlay',
                                    'enabled'
                                  )
                                }
                                className={cn(
                                  'flex-1 cursor-pointer rounded-lg px-3 py-2 font-serif text-sm font-medium transition-colors',
                                  localConfig.text_to_speech?.autoPlay ===
                                    'enabled'
                                    ? isDark
                                      ? 'bg-stone-600 text-white'
                                      : 'bg-stone-700 text-white'
                                    : isDark
                                      ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                )}
                              >
                                {t('sections.textToSpeech.autoPlay.enabled')}
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateConfig(
                                    'text_to_speech.autoPlay',
                                    'disabled'
                                  )
                                }
                                className={cn(
                                  'flex-1 cursor-pointer rounded-lg px-3 py-2 font-serif text-sm font-medium transition-colors',
                                  localConfig.text_to_speech?.autoPlay ===
                                    'disabled'
                                    ? isDark
                                      ? 'bg-stone-600 text-white'
                                      : 'bg-stone-700 text-white'
                                    : isDark
                                      ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                )}
                              >
                                {t('sections.textToSpeech.autoPlay.disabled')}
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Retriever resource config */}
                <div className="space-y-4">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4',
                      isDark ? 'bg-stone-800' : 'bg-stone-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      />
                      <span
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        )}
                      >
                        {t('sections.retrieverResource.title')}
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={
                          localConfig.retriever_resource?.enabled || false
                        }
                        onChange={e =>
                          updateConfig(
                            'retriever_resource.enabled',
                            e.target.checked
                          )
                        }
                        className="peer sr-only"
                      />
                      <div
                        className={cn(
                          'peer relative h-6 w-11 rounded-full transition-colors',
                          'peer-focus:ring-2',
                          localConfig.retriever_resource?.enabled
                            ? isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-700 peer-focus:ring-stone-300'
                            : isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-300 peer-focus:ring-stone-300'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                            localConfig.retriever_resource?.enabled
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          )}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* Annotation reply config */}
                <div className="space-y-4">
                  <div
                    className={cn(
                      'flex items-center justify-between rounded-xl p-4',
                      isDark ? 'bg-stone-800' : 'bg-stone-50'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Tag
                        className={cn(
                          'h-4 w-4',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      />
                      <span
                        className={cn(
                          'font-serif font-medium',
                          isDark ? 'text-stone-200' : 'text-stone-800'
                        )}
                      >
                        {t('sections.annotationReply.title')}
                      </span>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={localConfig.annotation_reply?.enabled || false}
                        onChange={e =>
                          updateConfig(
                            'annotation_reply.enabled',
                            e.target.checked
                          )
                        }
                        className="peer sr-only"
                      />
                      <div
                        className={cn(
                          'peer relative h-6 w-11 rounded-full transition-colors',
                          'peer-focus:ring-2',
                          localConfig.annotation_reply?.enabled
                            ? isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-700 peer-focus:ring-stone-300'
                            : isDark
                              ? 'bg-stone-600 peer-focus:ring-stone-500'
                              : 'bg-stone-300 peer-focus:ring-stone-300'
                        )}
                      >
                        <div
                          className={cn(
                            'absolute top-0.5 left-0.5 h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                            localConfig.annotation_reply?.enabled
                              ? 'translate-x-5'
                              : 'translate-x-0'
                          )}
                        />
                      </div>
                    </label>
                  </div>
                </div>

                {/* User input form config */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('user_input')}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors',
                      isDark
                        ? 'bg-stone-800 hover:bg-stone-700'
                        : 'bg-stone-50 hover:bg-stone-100'
                    )}
                  >
                    <FormInput
                      className={cn(
                        'h-4 w-4',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 text-left font-serif font-medium',
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      )}
                    >
                      {t('sections.userInputForm.title')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-serif text-xs',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      >
                        {t('sections.userInputForm.fieldsCount', {
                          count: localConfig.user_input_form?.length || 0,
                        })}
                      </span>
                      {expandedSections.has('user_input') ? (
                        <ChevronDown className="h-4 w-4 text-stone-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-stone-400" />
                      )}
                    </div>
                  </button>

                  {expandedSections.has('user_input') && (
                    <div
                      className={cn(
                        'space-y-4 rounded-xl border p-4',
                        isDark
                          ? 'border-stone-700 bg-stone-800/50'
                          : 'border-stone-200 bg-stone-50/50'
                      )}
                    >
                      <div
                        className={cn(
                          'font-serif text-sm',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      >
                        {t('sections.userInputForm.description')}
                      </div>

                      {(localConfig.user_input_form || []).length > 0 ? (
                        <div className="space-y-3">
                          {(localConfig.user_input_form || []).map(
                            (formItem, index) => {
                              const fieldType = Object.keys(formItem)[0];
                              const fieldConfig =
                                formItem[fieldType as keyof typeof formItem];

                              return (
                                <div
                                  key={index}
                                  className={cn(
                                    'rounded-lg border p-3',
                                    isDark
                                      ? 'border-stone-600 bg-stone-700/50'
                                      : 'border-stone-300 bg-stone-100/50'
                                  )}
                                >
                                  <div className="mb-2 flex items-center justify-between">
                                    <span
                                      className={cn(
                                        'font-serif text-sm font-medium',
                                        isDark
                                          ? 'text-stone-200'
                                          : 'text-stone-800'
                                      )}
                                    >
                                      {fieldConfig?.label ||
                                        t('sections.userInputForm.fieldLabel', {
                                          index: index + 1,
                                        })}
                                    </span>
                                    <span
                                      className={cn(
                                        'rounded px-2 py-1 font-serif text-xs',
                                        isDark
                                          ? 'bg-stone-600 text-stone-300'
                                          : 'bg-stone-200 text-stone-700'
                                      )}
                                    >
                                      {fieldType}
                                    </span>
                                  </div>
                                  <div
                                    className={cn(
                                      'font-serif text-xs',
                                      isDark
                                        ? 'text-stone-400'
                                        : 'text-stone-600'
                                    )}
                                  >
                                    {t('sections.userInputForm.fieldInfo', {
                                      variable: fieldConfig?.variable || 'N/A',
                                      required: fieldConfig?.required
                                        ? t(
                                            'sections.userInputForm.fieldRequired'
                                          )
                                        : t(
                                            'sections.userInputForm.fieldOptional'
                                          ),
                                      defaultValue:
                                        fieldConfig?.default ||
                                        t(
                                          'sections.userInputForm.fieldNoDefault'
                                        ),
                                    })}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      ) : (
                        <div
                          className={cn(
                            'py-8 text-center font-serif text-sm',
                            isDark ? 'text-stone-500' : 'text-stone-400'
                          )}
                        >
                          {t('sections.userInputForm.noFields')}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* System parameters config */}
                <div className="space-y-4">
                  <button
                    onClick={() => toggleSection('system')}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-xl p-4 transition-colors',
                      isDark
                        ? 'bg-stone-800 hover:bg-stone-700'
                        : 'bg-stone-50 hover:bg-stone-100'
                    )}
                  >
                    <Settings2
                      className={cn(
                        'h-4 w-4',
                        isDark ? 'text-stone-400' : 'text-stone-600'
                      )}
                    />
                    <span
                      className={cn(
                        'flex-1 text-left font-serif font-medium',
                        isDark ? 'text-stone-200' : 'text-stone-800'
                      )}
                    >
                      {t('sections.systemParameters.title')}
                    </span>
                    {expandedSections.has('system') ? (
                      <ChevronDown className="h-4 w-4 text-stone-400" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-stone-400" />
                    )}
                  </button>

                  {expandedSections.has('system') && (
                    <div
                      className={cn(
                        'space-y-4 rounded-xl border p-4',
                        isDark
                          ? 'border-stone-700 bg-stone-800/50'
                          : 'border-stone-200 bg-stone-50/50'
                      )}
                    >
                      <div className="grid grid-cols-2 gap-4">
                        {/* Document upload size limit */}
                        <div>
                          <label
                            className={cn(
                              'mb-2 block font-serif text-sm font-medium',
                              isDark ? 'text-stone-300' : 'text-stone-700'
                            )}
                          >
                            {t('sections.systemParameters.fileSizeLimit')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={
                              localConfig.system_parameters?.file_size_limit ||
                              15
                            }
                            onChange={e =>
                              updateConfig(
                                'system_parameters.file_size_limit',
                                parseInt(e.target.value)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border px-3 py-2 font-serif',
                              isDark
                                ? 'border-stone-600 bg-stone-700 text-stone-100'
                                : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>

                        {/* Image upload size limit */}
                        <div>
                          <label
                            className={cn(
                              'mb-2 block font-serif text-sm font-medium',
                              isDark ? 'text-stone-300' : 'text-stone-700'
                            )}
                          >
                            {t('sections.systemParameters.imageSizeLimit')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={
                              localConfig.system_parameters
                                ?.image_file_size_limit || 10
                            }
                            onChange={e =>
                              updateConfig(
                                'system_parameters.image_file_size_limit',
                                parseInt(e.target.value)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border px-3 py-2 font-serif',
                              isDark
                                ? 'border-stone-600 bg-stone-700 text-stone-100'
                                : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>

                        {/* Audio upload size limit */}
                        <div>
                          <label
                            className={cn(
                              'mb-2 block font-serif text-sm font-medium',
                              isDark ? 'text-stone-300' : 'text-stone-700'
                            )}
                          >
                            {t('sections.systemParameters.audioSizeLimit')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="200"
                            value={
                              localConfig.system_parameters
                                ?.audio_file_size_limit || 50
                            }
                            onChange={e =>
                              updateConfig(
                                'system_parameters.audio_file_size_limit',
                                parseInt(e.target.value)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border px-3 py-2 font-serif',
                              isDark
                                ? 'border-stone-600 bg-stone-700 text-stone-100'
                                : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>

                        {/* Video upload size limit */}
                        <div>
                          <label
                            className={cn(
                              'mb-2 block font-serif text-sm font-medium',
                              isDark ? 'text-stone-300' : 'text-stone-700'
                            )}
                          >
                            {t('sections.systemParameters.videoSizeLimit')}
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={
                              localConfig.system_parameters
                                ?.video_file_size_limit || 100
                            }
                            onChange={e =>
                              updateConfig(
                                'system_parameters.video_file_size_limit',
                                parseInt(e.target.value)
                              )
                            }
                            className={cn(
                              'w-full rounded-lg border px-3 py-2 font-serif',
                              isDark
                                ? 'border-stone-600 bg-stone-700 text-stone-100'
                                : 'border-stone-300 bg-white text-stone-900'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action bar */}
            <div
              className={cn(
                'flex-shrink-0 border-t p-6',
                isDark ? 'border-stone-700' : 'border-stone-200'
              )}
            >
              {hasChanges && (
                <p
                  className={cn(
                    'mb-3 text-center font-serif text-xs',
                    isDark ? 'text-stone-400' : 'text-stone-600'
                  )}
                >
                  {t('unsavedChanges')}
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  disabled={!hasChanges}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3',
                    'font-serif font-medium transition-colors',
                    hasChanges
                      ? isDark
                        ? 'cursor-pointer bg-stone-700 text-stone-200 hover:bg-stone-600'
                        : 'cursor-pointer bg-stone-100 text-stone-700 hover:bg-stone-200'
                      : 'cursor-not-allowed bg-stone-500/20 text-stone-500 opacity-50'
                  )}
                >
                  <RotateCcw className="h-4 w-4" />
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3',
                    'font-serif font-medium transition-colors',
                    hasChanges
                      ? isDark
                        ? 'cursor-pointer bg-stone-600 text-white hover:bg-stone-500'
                        : 'cursor-pointer bg-stone-700 text-white hover:bg-stone-800'
                      : 'cursor-not-allowed bg-stone-500/20 text-stone-500 opacity-50'
                  )}
                >
                  <Save className="h-4 w-4" />
                  {t('buttons.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File upload modal */}
      {showFileUploadModal && (
        <>
          <div
            className="fixed inset-0 z-60 cursor-pointer bg-black/30 backdrop-blur-sm"
            onClick={handleFileUploadCancel}
          />
          <div className="fixed inset-x-4 top-4 bottom-24 z-60 flex items-center justify-center">
            <div className="flex max-h-full w-full max-w-[420px] flex-col">
              <div
                className={cn(
                  'flex h-full flex-col rounded-xl border shadow-2xl',
                  isDark
                    ? 'border-stone-700 bg-stone-900'
                    : 'border-stone-200 bg-white'
                )}
              >
                {/* Modal header */}
                <div
                  className={cn(
                    'flex flex-shrink-0 items-center justify-between border-b p-4',
                    isDark ? 'border-stone-700' : 'border-stone-200'
                  )}
                >
                  <h3
                    className={cn(
                      'font-serif text-base font-bold',
                      isDark ? 'text-stone-100' : 'text-stone-900'
                    )}
                  >
                    {t('fileUploadModal.title')}
                  </h3>
                  <button
                    onClick={handleFileUploadCancel}
                    className={cn(
                      'cursor-pointer rounded-lg p-1.5 transition-colors',
                      isDark
                        ? 'text-stone-400 hover:bg-stone-800 hover:text-stone-200'
                        : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                    )}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Modal content */}
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {/* Upload method */}
                    <div>
                      <label
                        className={cn(
                          'mb-2 block font-serif text-sm font-medium',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                      >
                        {t('fileUploadModal.uploadMethod.label')}
                      </label>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setUploadMethod('local')}
                          className={cn(
                            'cursor-pointer rounded-lg px-3 py-1.5 font-serif text-xs transition-colors',
                            uploadMethod === 'local'
                              ? isDark
                                ? 'bg-stone-600 text-white'
                                : 'bg-stone-700 text-white'
                              : isDark
                                ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          )}
                        >
                          {t('fileUploadModal.uploadMethod.local')}
                        </button>
                        <button
                          onClick={() => setUploadMethod('url')}
                          className={cn(
                            'cursor-pointer rounded-lg px-3 py-1.5 font-serif text-xs transition-colors',
                            uploadMethod === 'url'
                              ? isDark
                                ? 'bg-stone-600 text-white'
                                : 'bg-stone-700 text-white'
                              : isDark
                                ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          )}
                        >
                          {t('fileUploadModal.uploadMethod.url')}
                        </button>
                        <button
                          onClick={() => setUploadMethod('both')}
                          className={cn(
                            'cursor-pointer rounded-lg px-3 py-1.5 font-serif text-xs transition-colors',
                            uploadMethod === 'both'
                              ? isDark
                                ? 'bg-stone-600 text-white'
                                : 'bg-stone-700 text-white'
                              : isDark
                                ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                          )}
                        >
                          {t('fileUploadModal.uploadMethod.both')}
                        </button>
                      </div>
                    </div>

                    {/* Max files */}
                    <div>
                      <label
                        className={cn(
                          'mb-2 block font-serif text-sm font-medium',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                      >
                        {t('fileUploadModal.maxFiles.label')}
                      </label>
                      <p
                        className={cn(
                          'mb-2 font-serif text-xs',
                          isDark ? 'text-stone-400' : 'text-stone-600'
                        )}
                      >
                        {t('fileUploadModal.maxFiles.description')}
                      </p>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={maxFiles}
                          onChange={e => setMaxFiles(parseInt(e.target.value))}
                          className={cn(
                            'flex-1 cursor-pointer',
                            isDark ? 'accent-stone-600' : 'accent-stone-700'
                          )}
                        />
                        <span
                          className={cn(
                            'min-w-[1.5rem] text-center font-serif text-base font-medium',
                            isDark ? 'text-stone-200' : 'text-stone-800'
                          )}
                        >
                          {maxFiles}
                        </span>
                      </div>
                    </div>

                    {/* File types */}
                    <div>
                      <label
                        className={cn(
                          'mb-2 block font-serif text-sm font-medium',
                          isDark ? 'text-stone-300' : 'text-stone-700'
                        )}
                      >
                        {t('fileUploadModal.fileTypes.label')}
                      </label>
                      <div className="space-y-2">
                        {Object.entries(FILE_TYPE_CONFIG).map(
                          ([fileType, config]) => {
                            const IconComponent = config.icon;
                            const isEnabled = enabledFileTypes.has(fileType);

                            return (
                              <div key={fileType} className="space-y-2">
                                <div
                                  className={cn(
                                    'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors',
                                    isEnabled
                                      ? isDark
                                        ? 'border-stone-500 bg-stone-700/50'
                                        : 'border-stone-400 bg-stone-100/50'
                                      : isDark
                                        ? 'border-stone-600 bg-stone-800/50'
                                        : 'border-stone-200 bg-stone-50/50'
                                  )}
                                  onClick={() => toggleFileType(fileType)}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        'rounded-lg p-1.5',
                                        isEnabled
                                          ? isDark
                                            ? 'bg-stone-600 text-white'
                                            : 'bg-stone-700 text-white'
                                          : isDark
                                            ? 'bg-stone-700 text-stone-400'
                                            : 'bg-stone-200 text-stone-600'
                                      )}
                                    >
                                      <IconComponent className="h-3 w-3" />
                                    </div>
                                    <div>
                                      <div
                                        className={cn(
                                          'font-serif text-sm font-medium',
                                          isDark
                                            ? 'text-stone-200'
                                            : 'text-stone-800'
                                        )}
                                      >
                                        {t(
                                          `fileUploadModal.fileTypes.${fileType}`
                                        )}
                                      </div>
                                      <div
                                        className={cn(
                                          'font-serif text-xs',
                                          isDark
                                            ? 'text-stone-400'
                                            : 'text-stone-600'
                                        )}
                                      >
                                        {config.extensions.length > 0
                                          ? config.extensions
                                              .slice(0, 3)
                                              .join(', ')
                                              .toUpperCase() +
                                            (config.extensions.length > 3
                                              ? '...'
                                              : '')
                                          : config.maxSize}
                                      </div>
                                    </div>
                                  </div>
                                  <input
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={() => toggleFileType(fileType)}
                                    className={cn(
                                      'h-4 w-4 cursor-pointer rounded border',
                                      isEnabled
                                        ? isDark
                                          ? 'border-stone-600 bg-stone-600 accent-stone-600'
                                          : 'border-stone-700 bg-stone-700 accent-stone-700'
                                        : isDark
                                          ? 'border-stone-500 accent-stone-600'
                                          : 'border-stone-300 accent-stone-700'
                                    )}
                                  />
                                </div>

                                {/* Custom file types */}
                                {fileType === 'other' && isEnabled && (
                                  <div
                                    className={cn(
                                      'ml-4 rounded-lg border p-3',
                                      isDark
                                        ? 'border-stone-600 bg-stone-800'
                                        : 'border-stone-200 bg-stone-50'
                                    )}
                                  >
                                    <label
                                      className={cn(
                                        'mb-2 block font-serif text-xs font-medium',
                                        isDark
                                          ? 'text-stone-300'
                                          : 'text-stone-700'
                                      )}
                                    >
                                      {t(
                                        'fileUploadModal.fileTypes.customDescription'
                                      )}
                                    </label>
                                    <input
                                      type="text"
                                      value={customFileTypes}
                                      onChange={e =>
                                        setCustomFileTypes(e.target.value)
                                      }
                                      className={cn(
                                        'w-full rounded border px-2 py-1.5 font-serif text-xs',
                                        isDark
                                          ? 'border-stone-600 bg-stone-700 text-stone-100 placeholder-stone-400'
                                          : 'border-stone-300 bg-white text-stone-900 placeholder-stone-500'
                                      )}
                                      placeholder={t(
                                        'fileUploadModal.fileTypes.customPlaceholder'
                                      )}
                                    />
                                    <p
                                      className={cn(
                                        'mt-1 font-serif text-xs',
                                        isDark
                                          ? 'text-stone-400'
                                          : 'text-stone-600'
                                      )}
                                    >
                                      {t(
                                        'fileUploadModal.fileTypes.customDescription'
                                      )}
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal actions */}
                <div
                  className={cn(
                    'flex flex-shrink-0 gap-2 border-t p-4',
                    isDark ? 'border-stone-700' : 'border-stone-200'
                  )}
                >
                  <button
                    onClick={handleFileUploadCancel}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg px-3 py-2 font-serif text-sm font-medium transition-colors',
                      isDark
                        ? 'bg-stone-700 text-stone-200 hover:bg-stone-600'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    )}
                  >
                    {t('buttons.cancel')}
                  </button>
                  <button
                    onClick={handleFileUploadSave}
                    className={cn(
                      'flex-1 cursor-pointer rounded-lg px-3 py-2 font-serif text-sm font-medium transition-colors',
                      isDark
                        ? 'bg-stone-600 text-white hover:bg-stone-500'
                        : 'bg-stone-700 text-white hover:bg-stone-800'
                    )}
                  >
                    {t('buttons.confirm')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default DifyParametersPanel;
