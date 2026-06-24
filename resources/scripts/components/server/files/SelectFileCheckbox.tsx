import { useRef } from 'react';
import type { FileObject } from '@/api/server/files/loadDirectory';
import { Checkbox } from '@/components/elements/CheckboxNew';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';

import { ServerContext } from '@/state/server';

// Helper function to sort files
const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1]?.name);
};

const SelectFileCheckbox = ({ name }: { name: string }) => {
    const isChecked = ServerContext.useStoreState((state) => state.files.selectedFiles.indexOf(name) >= 0);
    const lastSelectedFile = ServerContext.useStoreState((state) => state.files.lastSelectedFile);
    const { data: files } = useFileManagerSwr();

    const appendSelectedFile = ServerContext.useStoreActions((actions) => actions.files.appendSelectedFile);
    const removeSelectedFile = ServerContext.useStoreActions((actions) => actions.files.removeSelectedFile);
    const selectFileRange = ServerContext.useStoreActions((actions) => actions.files.selectFileRange);
    const setLastSelectedFile = ServerContext.useStoreActions((actions) => actions.files.setLastSelectedFile);

    const checkboxRef = useRef<HTMLButtonElement>(null);

    const handleCheckboxChange = (checked: boolean | string) => {
        const event = window.event as MouseEvent;
        const isShiftClick = event?.shiftKey;

        if (isShiftClick && lastSelectedFile && files) {
            // Shift+Click: select range
            const sortedFiles = sortFiles(files);
            const fileNames = sortedFiles.map((file) => file.name);
            selectFileRange({ from: lastSelectedFile, to: name, files: fileNames });
        } else {
            // Normal click: toggle selection
            const finalChecked = typeof checked === 'boolean' ? checked : !isChecked;
            if (finalChecked) {
                appendSelectedFile(name);
            } else {
                removeSelectedFile(name);
            }
        }

        // Update last selected file
        setLastSelectedFile(name);
    };

    return (
        <Checkbox
            checked={isChecked}
            className='ml-4'
            name={'selectedFiles'}
            onCheckedChange={handleCheckboxChange}
            ref={checkboxRef}
            value={name}
        />
    );
};

export default SelectFileCheckbox;
