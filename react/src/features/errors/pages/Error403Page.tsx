import { ErrorPageLayout } from '../components/ErrorPageLayout';
import { LockKey } from '@phosphor-icons/react';

export const Error403Page = () => {
    return (
        <ErrorPageLayout
            errorCode="403"
            title="FORBIDDEN"
            description="You don't have permission to access this sector of the universe. Please contact mission control."
            icon={<LockKey size={240} weight="duotone" />}
        />
    );
};
