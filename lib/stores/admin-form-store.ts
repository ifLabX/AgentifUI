import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ServiceInstance } from '@lib/types/database';

interface AdminFormState {
  // API配置页面状态
  tabValue: number;
  isAddingInstance: boolean;
  editingInstance: ServiceInstance | null;
  
  // 表单数据
  formData: {
    provider_id: string;
    instance_id: string;
    name: string;
    display_name: string;
    description: string;
    api_key: string;
    api_path: string;
    is_default: boolean;
  };
  
  // 操作方法
  setTabValue: (value: number) => void;
  setIsAddingInstance: (value: boolean) => void;
  setEditingInstance: (instance: ServiceInstance | null) => void;
  updateFormData: (data: Partial<AdminFormState['formData']>) => void;
  clearFormData: () => void;
  resetFormState: () => void;
}

const initialFormData = {
  provider_id: '',
  instance_id: '',
  name: '',
  display_name: '',
  description: '',
  api_key: '',
  api_path: '',
  is_default: false,
};

export const useAdminFormStore = create<AdminFormState>()(
  persist(
    (set, get) => ({
      // 初始状态
      tabValue: 0,
      isAddingInstance: false,
      editingInstance: null,
      formData: initialFormData,
      
      // 操作方法
      setTabValue: (value) => set({ tabValue: value }),
      
      setIsAddingInstance: (value) => set({ isAddingInstance: value }),
      
      setEditingInstance: (instance) => {
        set({ 
          editingInstance: instance,
          isAddingInstance: !!instance,
          // 如果是编辑模式，填充表单数据
          formData: instance ? {
            provider_id: instance.provider_id || '',
            instance_id: instance.instance_id || '',
            name: instance.name || '',
            display_name: instance.display_name || '',
            description: instance.description || '',
            api_key: '', // API密钥不回填，出于安全考虑
            api_path: instance.api_path || '',
            is_default: instance.is_default || false,
          } : initialFormData
        });
      },
      
      updateFormData: (data) => {
        set(state => ({
          formData: { ...state.formData, ...data }
        }));
      },
      
      clearFormData: () => set({ formData: initialFormData }),
      
      resetFormState: () => set({
        tabValue: 0,
        isAddingInstance: false,
        editingInstance: null,
        formData: initialFormData,
      }),
    }),
    {
      name: 'admin-form-storage',
      storage: createJSONStorage(() => sessionStorage), // 使用sessionStorage，关闭浏览器后清除
      // 只持久化表单相关状态，不持久化临时状态
      partialize: (state) => ({
        tabValue: state.tabValue,
        isAddingInstance: state.isAddingInstance,
        editingInstance: state.editingInstance,
        formData: state.formData,
      }),
    }
  )
); 