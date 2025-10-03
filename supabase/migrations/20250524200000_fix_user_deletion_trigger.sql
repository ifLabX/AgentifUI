-- 修复用户删除触发器问题
-- 当前阶段用户都是个人注册，不涉及组织，应该允许直接删除

-- 临时禁用可能导致问题的用户删除前触发器
DROP TRIGGER IF EXISTS handle_user_deletion_prep ON auth.users;

-- 添加注释说明：当后期引入企业功能时，可以重新启用
-- CREATE TRIGGER handle_user_deletion_prep
--   BEFORE DELETE ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION handle_user_deletion_prep();

NOTIFY pgrst, 'reload schema';