import { ref } from 'vue'
import type { MyPageContent, MyPageSearch } from '3dm-im-components'

/**
 * page-search 与 page-content 联动（参照 yitai hooks/usePageContent）
 */
function usePageContent(
  resetBefore?: (queryInfo?: any) => void,
  resetAfter?: (queryInfo?: any) => void,
  searchBefore?: (queryInfo: any) => void,
  searchAfter?: (queryInfo: any) => void,
) {
  const searchData = ref<any>()
  const contentRef = ref<InstanceType<typeof MyPageContent>>()
  const searchRef = ref<InstanceType<typeof MyPageSearch>>()

  async function handleQueryClick(queryInfo: any) {
    searchBefore && searchBefore(queryInfo)
    searchData.value = queryInfo
    await contentRef.value?.featchPageListData(queryInfo)
    searchAfter && searchAfter(queryInfo)
  }

  async function handleResetClick() {
    resetBefore && resetBefore()
    await contentRef.value?.featchPageListData()
    resetAfter && resetAfter()
  }

  function getSelectionRows() {
    return contentRef.value?.getSelectionRows()
  }

  function setTableList(lists: any[]) {
    contentRef.value?.setTableList(lists)
  }

  return {
    searchRef,
    searchData,
    contentRef,
    handleQueryClick,
    handleResetClick,
    getSelectionRows,
    setTableList,
  }
}

export default usePageContent