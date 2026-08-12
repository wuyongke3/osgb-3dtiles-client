import { USER } from '../../../../../enums';

declare const modalConfig: {
    url: {
        newUrl: USER;
        editUrl: USER;
        listUrl: USER;
    };
    header: {
        newTitle: string;
        editTitle: string;
    };
    formItems: ({
        type: string;
        formItemBind: {
            prop: string;
            label: string;
        };
        componentBind: {
            disabled: boolean;
            clearable?: undefined;
            placeholder?: undefined;
            autosize?: undefined;
            type?: undefined;
        };
        slotName?: undefined;
    } | {
        type: string;
        formItemBind: {
            prop: string;
            label: string;
        };
        componentBind: {
            clearable: boolean;
            placeholder: string;
            disabled?: undefined;
            autosize?: undefined;
            type?: undefined;
        };
        slotName?: undefined;
    } | {
        type: string;
        formItemBind: {
            prop: string;
            label: string;
        };
        componentBind: {
            disabled?: undefined;
            clearable?: undefined;
            placeholder?: undefined;
            autosize?: undefined;
            type?: undefined;
        };
        slotName: string;
    } | {
        type: string;
        formItemBind: {
            prop: string;
            label: string;
        };
        componentBind: {
            autosize: {
                minRows: number;
            };
            type: string;
            clearable: boolean;
            placeholder: string;
            disabled?: undefined;
        };
        slotName?: undefined;
    })[];
};
export default modalConfig;
