import { NotificationService } from '@core/services/notification.service';

export type ImportFileReadMode = 'arrayBuffer' | 'binaryString' | 'text';

export function readImportFile(
    file: Blob,
    notification: NotificationService,
    mode: ImportFileReadMode,
    callback: (result: string | ArrayBuffer) => void | Promise<void>
): void {
    const reader = new FileReader();
    notification.loadingAnimationV2({ icon: 'circle', text: 'Đang đọc file, vui lòng chờ' });

    const stopLoading = () => notification.disableLoadingAnimationV2();
    const handleError = () => {
        stopLoading();
        notification.toastError('Không thể đọc file, vui lòng kiểm tra và thử lại');
    };

    reader.onerror = handleError;
    reader.onabort = stopLoading;
    reader.onload = () => {
        requestAnimationFrame(() => {
            setTimeout(async () => {
                try {
                    await callback(reader.result as string | ArrayBuffer);
                } catch {
                    notification.toastError('Không thể đọc dữ liệu trong file, vui lòng kiểm tra và thử lại');
                } finally {
                    stopLoading();
                }
            });
        });
    };

    try {
        switch (mode) {
            case 'binaryString':
                reader.readAsBinaryString(file);
                break;
            case 'text':
                reader.readAsText(file);
                break;
            default:
                reader.readAsArrayBuffer(file);
                break;
        }
    } catch {
        handleError();
    }
}
