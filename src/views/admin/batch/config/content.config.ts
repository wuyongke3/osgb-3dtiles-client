import { h } from 'vue'

const statusMap: Record<string, string> = {
  idle: '待转换',
  running: '转换中',
  success: '成功',
  error: '失败',
  cancelled: '已取消',
}

const contentConfig = {
  key: 'batch-records',
  url: {
    listUrl: 'local:batch-records',
    deleteUrl: 'local:batch-records',
  },
  titleBtn: {
    left: [
      { event: 'handleNewBatchClick', bind: { type: 'primary' }, label: '新增批次' },
      { event: 'handleUploadClick', bind: { type: 'primary' }, label: '上传' },
      { event: 'handleDeleteBtnClick', bind: { type: 'warning' }, label: '删除' },
    ],
    right: [
      { event: 'handleRefreshClick', bind: { type: 'primary' }, label: '刷新' },
    ],
  },
  propsList: [
    { type: 'selection', label: '选择', width: '60px' },
    { type: 'normal', label: 'ID', prop: 'id', width: '60px' },
    { type: 'normal', label: '原数据', prop: 'source_name', minWidth: '160px' },
    { type: 'normal', label: '更新数据', prop: 'update_name', minWidth: '140px' },
    {
      type: 'render',
      label: '透明',
      prop: 'transparent',
      width: '80px',
      align: 'center',
      render: ({ row }: any) => (row.transparent === 1 ? '是' : '否'),
    },
    {
      type: 'render',
      label: '边缘精细度',
      prop: 'edge_precision',
      width: '110px',
      align: 'center',
      render: ({ row }: any) => (row.edge_precision ?? 85) + '%',
    },
    {
      type: 'render',
      label: '瓦片聚合',
      prop: 'aggregate',
      width: '100px',
      align: 'center',
      render: ({ row }: any) => (row.aggregate === 1 ? '是' : '否'),
    },
    {
      type: 'render',
      label: '状态',
      prop: 'status',
      width: '90px',
      align: 'center',
      render: ({ row }: any) => h('span', { class: 'st st-' + (row.status || 'idle') }, statusMap[row.status || 'idle'] || '-'),
    },
    { type: 'normal', label: '输出', prop: 'merged_path', minWidth: '150px', showOverflowTooltip: true },
    {
      type: 'handler',
      label: '操作',
      width: '150px',
      options: [
        { label: '转换', event: 'convert', bind: { type: 'primary', link: true, size: 'small' } },
        { label: '删除', event: 'remove', bind: { type: 'danger', link: true, size: 'small' } },
      ],
    },
  ],
}

export default contentConfig