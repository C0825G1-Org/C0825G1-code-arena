import { ErrorPageLayout } from '../components/ErrorPageLayout';
import { Warning } from '@phosphor-icons/react';

export const Error400Page = () => {
    return (
        <ErrorPageLayout
            errorCode="400"
            title="BAD REQUEST"
            description="The server could not understand your request. Check your coordinates and try again."
            icon={<Warning size={240} weight="duotone" />}
        />
    );
};
