// 批次记录查询条件（参照 yitai config/search.config.ts）
const searchConfig = {
  labelWidth: '100px',
  formItems: [
    {
      type: 'input',
      span: 6,
      formItemBind: { prop: 'source_name', label: '原数据名称' },
      componentBind: { clearable: true, placeholder: '请输入原数据名称' },
    },
    {
      type: 'input',
      span: 6,
      formItemBind: { prop: 'update_name', label: '更新数据名称' },
      componentBind: { clearable: true, placeholder: '请输入更新数据名称' },
    },
    {
      type: 'select',
      span: 6,
      formItemBind: { prop: 'status', label: '状态' },
      componentBind: { clearable: true, placeholder: '请选择状态' },
      options: [
        { label: '待转换', value: 'idle' },
        { label: '转换中', value: 'running' },
        { label: '成功', value: 'success' },
        { label: '失败', value: 'error' },
        { label: '已取消', value: 'cancelled' },
      ],
    },
    {
      type: 'select',
      span: 6,
      formItemBind: { prop: 'transparent', label: '是否透明' },
      componentBind: { clearable: true, placeholder: '请选择' },
      options: [
        { label: '是（透明）', value: 1 },
        { label: '否（不透明）', value: 2 },
      ],
    },
  ],
}

export default searchConfig