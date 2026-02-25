import { ErrorPageLayout } from '../components/ErrorPageLayout';
import { WarningOctagon } from '@phosphor-icons/react';

export const Error500Page = () => {
    return (
        <ErrorPageLayout
            errorCode="500"
            title="SERVER ERROR"
            description="Our primary propulsion system has encountered a critical failure. Engineers are working to restore systems."
            icon={<WarningOctagon size={240} weight="duotone" />}
        />
    );
};
