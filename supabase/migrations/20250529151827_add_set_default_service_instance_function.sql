-- 创建设置默认服务实例的存储过程
-- 确保原子性操作，防止时序问题

create or replace function set_default_service_instance(
  target_instance_id uuid,
  target_provider_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  -- 在事务中执行两个操作，确保原子性
  
  -- 1. 将同一提供商的所有实例设为非默认
  update service_instances 
  set is_default = false, updated_at = now()
  where provider_id = target_provider_id and is_default = true;
  
  -- 2. 将指定实例设为默认
  update service_instances 
  set is_default = true, updated_at = now()
  where id = target_instance_id;
  
  -- 验证操作结果
  if not exists (
    select 1 from service_instances 
    where id = target_instance_id and is_default = true
  ) then
    raise exception '设置默认服务实例失败';
  end if;
end;
$$;

-- 为函数添加注释
comment on function set_default_service_instance(uuid, uuid) is '原子性地设置默认服务实例，确保同一提供商只有一个默认实例'; 