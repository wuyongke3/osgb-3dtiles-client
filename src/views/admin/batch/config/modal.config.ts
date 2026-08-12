// 数据参数配置（新增/编辑转换记录，参照 yitai config/modal.config.ts）
const modalConfig = {
  btnText: { confirm: '保存', cancel: '取消' },
  url: {
    newUrl: 'local:batch-records',
    editUrl: 'local:batch-records',
    listUrl: 'local:batch-records',
  },
  header: {
    newTitle: '数据参数配置',
    editTitle: '编辑数据参数',
    labelWidth: '100px',
  },
  columns: ['source_path', 'source_name', 'update_path', 'update_name', 'transparent', 'edge_precision', 'aggregate'],
  formItems: [
    {
      type: 'custom',
      slotName: 'source_dir',
      formItemBind: { prop: 'source_path', label: '原数据', required: true },
    },
    {
      type: 'custom',
      slotName: 'update_dir',
      formItemBind: { prop: 'update_path', label: '更新数据' },
      // 更新数据为可选项：组件库默认所有表单项必填，这里关闭该校验
      isHasValidate: false,
    },
    {
      type: 'select',
      formItemBind: { prop: 'transparent', label: '是否透明' },
      componentBind: { clearable: true, placeholder: '请选择' },
      options: [
        { label: '是（透明）', value: 1 },
        { label: '否（不透明）', value: 2 },
      ],
      initialValue: 2,
    },
    {
      type: 'number',
      formItemBind: { prop: 'edge_precision', label: '边缘精细度' },
      componentBind: { min: 50, max: 98, placeholder: '50-98' },
      suffix: '%',
      initialValue: 85,
    },
    {
      type: 'select',
      formItemBind: { prop: 'aggregate', label: '瓦片聚合' },
      componentBind: { clearable: true, placeholder: '请选择' },
      options: [
        { label: '是（聚合）', value: 1 },
        { label: '否（不聚合）', value: 2 },
      ],
      initialValue: 2,
    },
  ],
}

export default modalConfig