import { ref } from 'vue'
import type { MyPageModal, modalPropsType } from '3dm-im-components'
import usePageStore from '../stores/page/page'

type CallbackFnType = (data?: any) => void

/**
 * page-modal 新增/编辑/查看联动（参照 yitai hooks/usePageModal，数据源为本地 store）
 */
function usePageModal<E = any>(
  newBefore?: CallbackFnType,
  newAfter?: CallbackFnType,
  editAfter?: CallbackFnType,
  editBefore?: CallbackFnType,
  handleClickBefore?: CallbackFnType,
  handleClickAfter?: CallbackFnType,
) {
  const pageStore = usePageStore()
  const modalRef = ref<InstanceType<typeof MyPageModal>>()
  const editData = ref<E>()

  async function handleNewBtnClick() {
    newBefore && (await newBefore())
    editData.value = undefined
    modalRef.value?.setModal()
    newAfter && (await newAfter())
  }

  async function handleEditBtnClick(itemData: any, isSee = false) {
    editBefore && (await editBefore(itemData))
    editData.value = itemData
    modalRef.value?.setModal(false, itemData, isSee)
    editAfter && (await editAfter(itemData))
  }

  async function handleCheckBtnClick(itemData: any, isSee = true) {
    editData.value = itemData
    modalRef.value?.setModal(false, itemData, isSee)
  }

  async function handleClick(
    infoData: any,
    props: modalPropsType,
    callBack: (code: number) => void,
  ) {
    if (handleClickBefore) {
      await handleClickBefore(infoData)
    }

    if (!modalRef.value?.isNewRef && modalRef.value?.editData) {
      // 编辑
      const resultCode = await pageStore.editPageDataAction(
        props.modalConfig.url.editUrl,
        modalRef.value?.editData.id,
        infoData,
      )
      callBack && callBack(resultCode)
    } else {
      // 新建
      const resultCode = props.newFun
        ? await props.newFun(infoData)
        : await pageStore.newPageDataAction(props.modalConfig.url.newUrl, infoData)
      callBack && callBack(resultCode)
    }
    handleClickAfter && (await handleClickAfter(infoData))
  }

  return {
    editData,
    modalRef,
    handleNewBtnClick,
    handleEditBtnClick,
    handleCheckBtnClick,
    handleClick,
  }
}

export default usePageModal