import { FunctionalComponent } from 'vue';
import { IBigFileUploadFinishResult, IBigFileUploadProps } from '../../types';

interface IProps extends IBigFileUploadProps {
}
type IEvents = {
    uploadSuccess: (data: IBigFileUploadFinishResult) => void;
    dialogClosed: () => void;
    dialogOpened: () => void;
};
interface IDefineExpose {
    /** @description 展示弹窗 */
    showDialog: () => void;
}
declare const BigFileUpload: FunctionalComponent<IProps, IEvents> & IDefineExpose;
export default BigFileUpload;
