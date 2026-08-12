import { ProgressProps } from 'element-plus';
import { FunctionalComponent } from 'vue';

interface IProps extends Partial<ProgressProps> {
    text: string;
}
declare const progressTsx: FunctionalComponent<IProps>;
export default progressTsx;
