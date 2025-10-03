-- 添加应用执行记录表
-- 用于存储工作流(workflow)和文本生成(text-generation)应用的执行记录
-- 这些应用类型不同于对话类应用，每次执行都是独立的任务

-- 创建执行类型枚举
CREATE TYPE execution_type AS ENUM ('workflow', 'text-generation');

-- 创建执行状态枚举
CREATE TYPE execution_status AS ENUM ('pending', 'running', 'completed', 'failed', 'stopped');

-- 创建应用执行记录表
CREATE TABLE IF NOT EXISTS app_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_instance_id UUID NOT NULL REFERENCES service_instances(id) ON DELETE CASCADE,
  
  -- 执行类型（基于service_instance的dify_apptype）
  execution_type execution_type NOT NULL,
  
  -- Dify API 返回的标识符
  external_execution_id VARCHAR(255), -- workflow_run_id 或 message_id
  task_id VARCHAR(255), -- Dify 返回的 task_id（主要用于workflow）
  
  -- 执行内容
  title VARCHAR(500) NOT NULL, -- 用户自定义标题或自动生成
  inputs JSONB NOT NULL DEFAULT '{}'::jsonb, -- 输入参数
  outputs JSONB, -- 输出结果（workflow的outputs或text-generation的content）
  
  -- 执行状态
  status execution_status NOT NULL DEFAULT 'pending',
  error_message TEXT, -- 错误信息
  
  -- 统计信息
  total_steps INTEGER DEFAULT 0, -- workflow的步骤数，text-generation为0
  total_tokens INTEGER DEFAULT 0,
  elapsed_time DECIMAL(10,3), -- 执行耗时（秒）
  
  -- 元数据
  metadata JSONB DEFAULT '{}'::jsonb, -- 扩展字段，如标签、备注等
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引以优化查询性能
CREATE INDEX idx_app_executions_user_created ON app_executions(user_id, created_at DESC);
CREATE INDEX idx_app_executions_service_instance ON app_executions(service_instance_id);
CREATE INDEX idx_app_executions_type_status ON app_executions(execution_type, status);
CREATE INDEX idx_app_executions_external_id ON app_executions(external_execution_id) WHERE external_execution_id IS NOT NULL;
CREATE INDEX idx_app_executions_status ON app_executions(status);

-- 添加注释说明表的用途
COMMENT ON TABLE app_executions IS '应用执行记录表，用于存储工作流和文本生成应用的执行历史';
COMMENT ON COLUMN app_executions.execution_type IS '执行类型：workflow(工作流) 或 text-generation(文本生成)';
COMMENT ON COLUMN app_executions.external_execution_id IS 'Dify API返回的执行ID，workflow为workflow_run_id，text-generation为message_id';
COMMENT ON COLUMN app_executions.task_id IS 'Dify返回的任务ID，主要用于workflow类型';
COMMENT ON COLUMN app_executions.inputs IS '执行输入参数，JSON格式存储';
COMMENT ON COLUMN app_executions.outputs IS '执行输出结果，JSON格式存储';
COMMENT ON COLUMN app_executions.total_steps IS '总步骤数，workflow应用使用，text-generation固定为0';
COMMENT ON COLUMN app_executions.metadata IS '扩展元数据，如标签、备注等';

-- 添加触发器自动更新 updated_at 字段
CREATE TRIGGER update_app_executions_updated_at
BEFORE UPDATE ON app_executions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE app_executions ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略：用户只能访问自己的执行记录
CREATE POLICY "用户可以查看自己的执行记录" ON app_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可以创建自己的执行记录" ON app_executions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可以更新自己的执行记录" ON app_executions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可以删除自己的执行记录" ON app_executions
  FOR DELETE USING (auth.uid() = user_id);

-- 管理员可以查看所有执行记录（用于系统管理）
CREATE POLICY "管理员可以查看所有执行记录" ON app_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 输出创建结果
DO $$
BEGIN
  RAISE NOTICE '应用执行记录表 app_executions 创建完成';
  RAISE NOTICE '支持的执行类型: workflow, text-generation';
  RAISE NOTICE '已创建相关索引和RLS策略';
END $$; 