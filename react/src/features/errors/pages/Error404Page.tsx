import { ErrorPageLayout } from '../components/ErrorPageLayout';
import { Planet } from '@phosphor-icons/react';

export const Error404Page = () => {
    return (
        <ErrorPageLayout
            errorCode="404"
            title="PAGE NOT FOUND"
            description="Your search has ventured beyond the known universe. The page you are looking for does not exist."
            icon={<Planet size={240} weight="duotone" />}
        />
    );
};
