import { IUser } from '../../../../types';

declare function showPage(editData: IUser): void;
declare const _default: import('vue').DefineComponent<{}, {
    showPage: typeof showPage;
}, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {
    handleClick: (...args: any[]) => void;
}, string, import('vue').PublicProps, Readonly<{}> & Readonly<{
    onHandleClick?: ((...args: any[]) => any) | undefined;
}>, {}, {}, {}, {}, string, import('vue').ComponentProvideOptions, true, {}, any>;
export default _default;
