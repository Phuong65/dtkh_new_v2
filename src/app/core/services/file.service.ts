import { Inject, Injectable } from '@angular/core';
import { getFileDir, getLinkDownload, getLinkDownload_tuyensinh, getLinkDrive, getLinkMedia, getLinkMedia_aws, getLinkMedia_tuyensinh } from '@env';
import { HttpClient, HttpErrorResponse, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { FileDto, OvicFileStore, OvicDriveFile, OvicFile, Download, Upload, OvicDriveFolder, OvicDocument } from '@core/models/file';
import { Observable, of } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, retry, scan, switchMap } from 'rxjs/operators';
import { Dto, OvicConditionParam } from '@core/models/dto';
import { saveAs } from 'file-saver';
import { SAVER, Saver } from '@core/providers/saver.provider';
import * as FileSaver from 'file-saver';
import { NotificationService } from './notification.service';
import { DownloadProcess, OvicDownloadProgressComponent } from '@modules/shared/components/ovic-download-progress/ovic-download-progress.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpParamsHeplerService } from './http-params-hepler.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { getLinkDownload_aws } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface gDUploadRes {
    code: string,
    data: {
        kind: string,
        id: string,
        name: string,
        mimeType: string,
        parents: string[],
        webContentLink?: string,
        webViewLink?: string,
        iconLink?: string,
        createdTime: string,
        modifiedTime: string,
        shared: boolean,
        originalFilename: string,
        fullFileExtension: string,
        fileExtension: string,
        size: string,
    }[]
    message: string,
}

@Injectable({
    providedIn: 'root'
})
export class FileService {

    constructor(
        private http: HttpClient,
        @Inject(SAVER) private save: Saver,
        private noitifi: NotificationService,
        private modalService: NgbModal,
        private httpHelper: HttpParamsHeplerService,
        private auth: AuthService
    ) { }

    /**********************************************************
     * Convert, prebuild and packet functions
     * ********************************************************/
    private static packFiles(files: File[], tag?: string, share?: number): FormData {
        const formData = new FormData();
        if (files && files.length) {
            for (const file of files) {
                formData.append('upload', file);
            }
        }

        if (tag) {
            formData.append('tag', tag);
        }

        if (share) {
            formData.append('public', share.toString());
        }

        return formData;
    }
    /*****************************by long**********************************/
    private static packFilesV2(files: File[], tag?: string, share?: number): FormData {
        const formData = new FormData();
        if (files && files.length) {
            for (const file of files) {
                formData.append('upload', file);
            }
        }

        if (tag) {
            formData.append('tag', tag);
        }
        if (share) {
            formData.append('public', share.toString());
        }

        return formData;
    }


    /**************************************************************
     * format bytes
     * @param bytes (File size in bytes)
     * @param decimals (Decimals point)
     *************************************************************/
    formatBytes(bytes, decimals = 2): string {
        if (!bytes || bytes === 0) {
            return '0 Bytes';
        }
        const k = 1024;
        const dm = decimals <= 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    base64ToFile(base64: string, fileName: string): File {
        const bytes = base64.split(',')[0].indexOf('base64') >= 0 ? atob(base64.split(',')[1]) : (<any>window).unescape(base64.split(',')[1]);
        const mime = base64.split(',')[0].split(':')[1].split(';')[0];
        const max = bytes.length;
        const ia = new Uint8Array(max);
        for (let i = 0; i < max; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new File([ia], fileName, { lastModified: new Date().getTime(), type: mime });
    }

    /**
     * Convert Object from Blob to File
     * */
    blobToFile(blob: Blob, fileName: string): File {
        return new File([blob], fileName, { lastModified: new Date().getTime(), type: blob.type });
    }

    /**
     * Convert Object from Blob to string of base64
     * */
    blobToBase64(blob: Blob | File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader;
            reader.onerror = () => resolve(null);
            reader.onload = () => resolve(reader.result.toString());
            reader.readAsDataURL(blob);
        });
    }

    getUploadDate(file: OvicFile | OvicDriveFile): string {
        let result = '__/__/____ --:--';
        const fileDate = file['created_at'] || file['createdTime'];
        if (fileDate) {
            const postIn = new Date(fileDate),
                date = postIn.getDate() < 10 ? '0'.concat(postIn.getDate().toString()) : postIn.getDate().toString(),
                month = postIn.getMonth() < 10 ? '0'.concat((postIn.getMonth() + 1).toString()) : (postIn.getMonth() + 1).toString(),
                year = postIn.getFullYear().toString(),
                hour = postIn.getHours() < 10 ? '0'.concat(postIn.getHours().toString()) : postIn.getHours().toString(),
                min = postIn.getMinutes() < 10 ? '0'.concat(postIn.getMinutes().toString()) : postIn.getMinutes().toString();
            result = ''.concat(date, '/', month, '/', year, ' ', hour, ':', min);
        }
        return result;
    }

    deleteFiles(ids: number[]): Observable<any> {
        return this.http.delete<Dto>(getLinkMedia(ids.join(',')));
    }

    deleteFile(id: number): Observable<any> {
        return this.deleteFiles([id]);
    }

    getFilesInfo(ids: string): Observable<OvicFile[]> {
        const fromObject = {
            include: ids,
            include_by: 'id'
        };
        const params = new HttpParams({ fromObject });
        return this.http.get<Dto>(getLinkMedia(''), { params }).pipe(map(res => res.data));
    }

    /**********************************************************
     * Upload file functions
     * ********************************************************/
    uploadFile(file, donvi_id: number = 0, user_id: number = 0): Observable<OvicFile> {
        const fromObject = { donvi_id, user_id };
        const params = new HttpParams({ fromObject });
        return this.http.post<Dto>(getLinkMedia(''), FileService.packFiles([file]), { params: params }).pipe(
            retry(2),
            map(res => Array.isArray(res.data) ? res.data[0] : res.data)
        );
    }

    uploadMultiFiles(files: File[] | any[], donvi_id: number, user_id: number): Observable<any> {
        const fromObject = { donvi_id, user_id };
        const params = new HttpParams({ fromObject });
        return this.http.post<Dto>(getLinkMedia(''), FileService.packFiles(files), { params: params }).pipe(
            retry(2),
            map(res => res.data)
        );
    }

    uploadFileWidthProgress(file, donvi_id: number = 0, user_id: number = 0): Observable<Upload> {
        const params = new HttpParams().set('donvi_id', donvi_id.toString()).set('user_id', user_id.toString());
        const initialState: Upload = { state: 'PENDING', progress: 0 };
        const calculateState = (upload: Upload, event: HttpEvent<unknown>): Upload => {
            if (this.isHttpProgressEvent(event)) {
                return { progress: event.total ? Math.round((100 * event.loaded) / event.total) : upload.progress, state: 'IN_PROGRESS' };
            }
            if (this.isHttpResponse(event)) {
                return { progress: 100, state: 'DONE' };
            }
            return upload;
        };
        return this.http.post(getLinkMedia(''), FileService.packFiles([file]), { params: params, reportProgress: true }).pipe(scan(calculateState, initialState));
    }

    updateFileInfo(id: number, info: { title?: string; donvi_id?: number; user_id?: number; shared?: string }): Observable<number> {
        return this.http.put<Dto>(getLinkMedia(id.toString(10)), info).pipe(map(res => res.data));
    }

    /* server AWS */
    uploadFileAwsWidthProgress(file, tag: string = ''): Observable<Upload> {
        const initialState: Upload = { state: 'PENDING', progress: 0 }
        const calculateState = (upload: Upload, event: HttpEvent<unknown>): Upload => {
            if (this.isHttpProgressEvent(event)) {
                return {
                    progress: event.total
                        ? Math.round((100 * event.loaded) / event.total)
                        : upload.progress,
                    state: 'IN_PROGRESS',
                }
            }
            if (this.isHttpResponse(event)) {
                return {
                    progress: 100,
                    state: 'DONE',
                    content: event.body
                }
            }
            return upload
        }

        return this.http.post(getLinkMedia_aws(''), FileService.packFiles([file], tag), { reportProgress: true, observe: 'events' }).pipe(scan(calculateState, initialState));
    }
    
    uploadFileAws(file, tag: string = '', share: number = 0): Observable<OvicFile> {
        const fromObject = {};
        const params = new HttpParams({ fromObject });
        return this.http.post<Dto>(getLinkMedia_aws(''), FileService.packFiles([file], tag, share), { params: params }).pipe(
            retry(2),
            map(res => Array.isArray(res.data) ? res.data[0] : res.data)
        );
    }


    getLibraryAws(option: ConditionOption): Observable<FileDto> {
        let _params = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                _params = _params.set(f.label, f.value);
            })
        return this.http.get<Dto>(getLinkMedia_aws(''), { params: _params });
    }

    getTrashFileAws(option: ConditionOption): Observable<FileDto> {
        let _params = option.page ? this.httpHelper.paramsConditionBuilder(option.condition).set("paged", option.page) : this.httpHelper.paramsConditionBuilder(option.condition);
        if (option.set && option.set.length)
            option.set.forEach(f => {
                _params = _params.set(f.label, f.value);
            })
        return this.http.get<Dto>(getLinkMedia_aws('trashed'), { params: _params });
    }

    restoreTrashFile(id: number): Observable<any> {
        return this.http.post<Dto>(getLinkMedia_aws('restore/'.concat(id.toString())), {});
    }

    updateAwsFileInfo(id: number, info: {}): Observable<number> {
        return this.http.put<Dto>(getLinkMedia_aws(id.toString(10)), info).pipe(map(res => res.data));
    }

    updateAwsFileInfoDatasByCol(id: number[], info: {}, col: string): Observable<number> {
        return this.http.put<Dto>(getLinkMedia_aws(id.toString()).concat("?by=", col), info).pipe(map(res => res.data));
    }

    deleteFileAws(id: number, info: { status: 0; user_id?: number; }): Observable<number> {
        return this.http.put<Dto>(getLinkMedia_aws(id.toString(10)), info).pipe(map(res => res.data));
    }

    deleteFileAwsNormal(ids: number[]): Observable<any> {
        return this.http.delete<Dto>(getLinkMedia_aws(ids.join(',')));
    }

    private _awsDownloadProcess(saver?: (b: Blob) => void): (source: Observable<HttpEvent<Blob>>) => Observable<Download> {
        return (source: Observable<HttpEvent<Blob>>) => source.pipe(
            scan(
                (download: Download, event): Download => {
                    if (this.isHttpProgressEvent(event)) {
                        return {
                            progress: event.total ? Math.round((100 * event.loaded) / event.total) : download.progress,
                            state: 'IN_PROGRESS',
                            content: null
                        };
                    }
                    if (this.isHttpResponse(event)) {
                        if (saver) {
                            saver(event.body);
                        }
                        return {
                            progress: 100,
                            state: 'DONE',
                            content: event.body
                        };
                    }
                    return download;
                },
                { state: 'PENDING', progress: 0, content: null }
            ),
            distinctUntilChanged((a, b) => a.state === b.state && a.progress === b.progress && a.content === b.content)
        );
    }

    AwsDownloadWithProgress(id: number, filename?: string): Observable<Download> {
        return this.AwsdownloadExternalWithProgress(getLinkDownload_aws(id.toString(10)), filename || null);
    }

    AwsdownloadExternalWithProgress(url: string, filename?: string): Observable<Download> {
        const saver = filename ? blob => this.save(blob, filename) : null;
        const params = new HttpParams().set('token', this.auth.accessToken);
        return this.http.get(url, { params, reportProgress: true, observe: 'events', responseType: 'blob' }).pipe(this._awsDownloadProcess(saver));
    }

    awsGetFileAsBlob(id: string): Observable<Blob> {
        const params = new HttpParams().set('token', this.auth.accessToken);
        return this.http.get(getLinkDownload_aws(id.toString()), { params, responseType: 'blob' });
        // return this.getAwsPublicUrl(id).pipe(switchMap(url => this.http.get(url, { responseType: 'blob' })));
    }

    getAwsPublicUrl(id: string): Observable<string> {
        return this.http.post<Dto>(getLinkDownload_aws(id), {}).pipe(map(res => res.data));
    }

    // awsGetFileAsBlob(id: number, filename?: string): Observable<Download> {
    //     return this.AwsdownloadExternalWithProgress(getLinkMedia_aws(id.toString(10)), filename || null);
    // }

    /**********************************************************
     * Download file functions
     * ********************************************************/
    downloadFileByName(fileName: string, title: string): Promise<boolean> {
        return new Promise(resolve => {
            this.getFileAsBlob(fileName).subscribe(
                {
                    next: stream => {
                        saveAs(stream, title);
                        resolve(true);
                    },
                    error: () => resolve(false)
                }
            );
        });
    }

    downloadFileFromLocalAssets(src: string, title: string): Promise<boolean> {
        return new Promise(resolve => {
            this.http.get(src, { responseType: 'blob' }).subscribe({
                next: stream => {
                    saveAs(stream, title);
                    resolve(true);
                },
                error: () => resolve(false)
            }
            );
        });
    }


    //tuyển sinh

    uploadFile_tuyensinh(file, donvi_id: number = 0, user_id: number = 0): Observable<OvicFile> {
        const fromObject = { donvi_id, user_id };
        const params = new HttpParams({ fromObject });
        return this.http.post<Dto>(getLinkMedia_tuyensinh(''), FileService.packFiles([file]), { params: params }).pipe(
            retry(2),
            map(res => Array.isArray(res.data) ? res.data[0] : res.data)
        );
    }

    getFileAsBlob_tuyensinh(name_or_id: string): Observable<Blob> {
        return this.http.get(getLinkDownload_tuyensinh(name_or_id), { responseType: 'blob' });
    }

    /**********************************************************
     * Load folder and year
     * ********************************************************/
    loadDir(): Observable<any> {
        return this.http.get(getFileDir());
    }

    getFileList(params: any): Observable<OvicFile[]> {
        const fromObject = Object.assign({ orderby: 'created_at', order: 'desc' }, params);
        return this.http.get<Dto>(getLinkMedia(''), { params: new HttpParams({ fromObject }) }).pipe(map(res => res.data));
    }

    getLibrary(limit: number, pageNumber: number, search: string): Observable<FileDto> {
        const _offset = (pageNumber * limit) - limit;
        let _params = new HttpParams().set('orderby', 'created_at').set('limit', limit.toString()).set('order', 'desc').set('offset', _offset.toString()).set('draw', pageNumber.toString());
        if (search.length) {
            _params = new HttpParams().set('orderby', 'created_at').set('limit', limit.toString()).set('title', search).set('order', 'desc').set('offset', _offset.toString()).set('draw', pageNumber.toString());
        }
        return this.http.get<Dto>(getLinkMedia(''), { params: _params });
    }

    getFileSize(file: OvicFile | OvicFileStore | OvicDriveFile): string {
        const fileSize = file.size ? (typeof file.size === 'string' ? parseInt(file.size, 10) : file.size) : 0;
        return this.formatBytes(fileSize);
    }

    getFileAsBlob(name_or_id: string): Observable<Blob> {
        return this.http.get(getLinkDownload(name_or_id), { responseType: 'blob' });
    }

    downloadFileAsBlob(imageUrl): Observable<Blob> {
        return this.http.get(imageUrl, { responseType: 'blob' });
    }

    getFileAsObjectUrl(name_or_id: string): Observable<string> {
        return this.http.get(getLinkDownload(name_or_id), { responseType: 'blob' }).pipe(map(res => URL.createObjectURL(res)));
    }

    getFileContent(src: string): Observable<string> {
        return this.http.get(src, { responseType: 'blob' }).pipe(map(res => URL.createObjectURL(res)));
    }

    getFileLocalAsBlob(src: string): Observable<Blob> {
        return this.http.get(src, { responseType: 'blob' });
    }

    getFileLocal(src: string): Observable<any> {
        return this.http.get(src);
    }

    getFileLocalAsJson(src: string): Observable<Object> {
        return this.http.get(src, { responseType: 'json' });
    }


    /************************************************************
     * Google drive
     * **********************************************************/
    getAllFileGoogleDrive(): Observable<OvicDriveFile[]> {
        return this.http.get<Dto>(getLinkDrive()).pipe(map(res => res.data || []));
    }

    /**
     * load file and folder from parent
     * @input folderId : id of folder
     * */
    gdLoadFileOnFolder(folderId: string): Observable<OvicDriveFile[]> {
        const params = new HttpParams().set('parents', folderId);
        return this.http.get<Dto>(getLinkDrive(), { params }).pipe(map(res => res.data || []));
    }

    gdSearch(input: { s?: string, parents?: string } | any): Observable<{ data: OvicDriveFile[], next?: string }> {
        const params = new HttpParams({ fromObject: input });
        return this.http.get<Dto>(getLinkDrive(), { params });
    }

    gdLoadMore(next: string, limit?: number): Observable<{ data: OvicDriveFile[], next?: string }> {
        if (!next) {
            return of({ data: [] });
        }
        const fromObject = { next };
        const params = new HttpParams({ fromObject });
        return this.http.get<Dto>(getLinkDrive(), { params });
    }

    gdGetFile(id: string): Observable<OvicDriveFile> {
        return this.http.get<Dto>(getLinkDrive(id)).pipe(map(res => res.data));
    }

    gdGetFileAsObjectUrl(id: string): Observable<string> {
        return this.http.get(getLinkDrive(id), { responseType: 'blob' }).pipe(map(res => URL.createObjectURL(res)));
    }

    gdDownloadWithProgress(id: string, filename?: string): Observable<Download> {
        return this.downloadExternalWithProgress(getLinkDrive('file/' + id), filename);
    }

    gdStreamMedia(id: string): Observable<HttpEvent<Blob>> {
        return this.http.get(getLinkDrive(id), { reportProgress: true, observe: 'events', responseType: 'blob' });
    }

    gdDeleteFile(id: string): Observable<any> {
        return this.http.delete<Dto>(getLinkDrive(id));
    }

    gdUploadFile(file: File, parentId?: string): Observable<gDUploadRes> {
        const headers = parentId ? new HttpHeaders().set('parents', parentId) : new HttpHeaders();
        return this.http.post<gDUploadRes>(getLinkDrive(), FileService.packFiles([file]), { headers });
    }

    /**************************************************************
     * Download and progress
     * ************************************************************/
    isHttpResponse<T>(event: HttpEvent<T>): event is HttpResponse<T> {
        return event.type === HttpEventType.Response;
    }

    isHttpProgressEvent(event: HttpEvent<unknown>): event is HttpProgressEvent {
        return (event.type === HttpEventType.DownloadProgress || event.type === HttpEventType.UploadProgress);
    }

    downloadWithProgress(id: number, filename?: string): Observable<Download> {
        return this.downloadExternalWithProgress(getLinkDownload(id.toString(10)), filename || null);
    }

    downloadExternalWithProgress(url: string, filename?: string): Observable<Download> {
        const saver = filename ? blob => this.save(blob, filename) : null;
        return this.http.get(url, { reportProgress: true, observe: 'events', responseType: 'blob' }).pipe(this._downloadProcess(saver));
    }

    private _downloadProcess(saver?: (b: Blob) => void): (source: Observable<HttpEvent<Blob>>) => Observable<Download> {
        return (source: Observable<HttpEvent<Blob>>) => source.pipe(
            scan(
                (download: Download, event): Download => {
                    if (this.isHttpProgressEvent(event)) {
                        return {
                            progress: event.total ? Math.round((100 * event.loaded) / event.total) : download.progress,
                            state: 'IN_PROGRESS',
                            content: null
                        };
                    }
                    if (this.isHttpResponse(event)) {
                        if (saver) {
                            saver(event.body);
                        }

                        return {
                            progress: 100,
                            state: 'DONE',
                            content: event.body
                        };
                    }
                    return download;
                },
                { state: 'PENDING', progress: 0, content: null }
            ),
            distinctUntilChanged((a, b) => a.state === b.state && a.progress === b.progress && a.content === b.content)
        );
    }

    gdShare(fileId: string): Observable<any> {
        return this.http.post<Dto>(getLinkDrive('shared/' + fileId), { id: 'anyoneWithLink' }).pipe(map(res => res.data || []));
    }

    gdCreateFolder(info: { name: string, parents: string }): Observable<OvicDriveFolder> {
        return this.http.post<Dto>(getLinkDrive('folder'), info).pipe(map(res => res.data));
    }

    /********************************************************************************
     * Download file with progress
     * ******************************************************************************/
    downloadUnionFileProgress(file: OvicFile | OvicDriveFile): Observable<Download> {
        return file ? this.downloadUnionFileProgressById(file.id, file['title'] || file['name']) : of({ content: null, progress: 0, state: 'PENDING' });
    }

    downloadUnionFileProgressById(fileId: number | string, fileName: string): Observable<Download> {
        let result: Observable<Download> = of({ content: null, progress: 0, state: 'PENDING' });
        if (fileId) {
            result = typeof fileId === 'number' ? this.downloadWithProgress(fileId, fileName) : this.gdDownloadWithProgress(fileId, fileName);
        }
        return result;
    }

    /********************************************************************************
     * Download file without progress
     * ******************************************************************************/
    downloadUnionFile(file: OvicFile | OvicDriveFile): Observable<Download> {
        return this.downloadUnionFileById(file.id, file['title'] || file['name']);
    }

    downloadUnionFileById(fileId: number | string, fileName: string): Observable<Download> {
        return this.downloadUnionFileProgressById(fileId, fileName).pipe(filter(f => f.state === 'DONE'));
    }

    /********************************************************************************
     * Get file with progress
     * ******************************************************************************/
    getUnionFileProgress({ id }: OvicFile | OvicDriveFile): Observable<Download> {
        return this.getUnionFileProgressById(id);
    }

    getUnionFileProgressById(fileId: number | string): Observable<Download> {
        let result: Observable<Download> = of({ content: null, progress: 0, state: 'PENDING' });
        if (fileId) {
            const url = typeof fileId === 'number' ? getLinkDownload(fileId.toString(10)) : getLinkDrive(fileId);
            result = this.http.get(url, { reportProgress: true, observe: 'events', responseType: 'blob' }).pipe(this._downloadProcess(null));
        }
        return result;
    }

    /********************************************************************************
     * Get file without progress
     * ******************************************************************************/
    getUnionFile({ id }: OvicFile | OvicDriveFile): Observable<string> {
        return this.getUnionFileById(id);
    }

    getUnionFileById(fileId: number | string): Observable<string> {
        let result: Observable<string> = of(null);
        if (fileId) {
            // const url = typeof fileId === 'number' ? getLinkDownload( fileId.toString( 10 ) ) : getLinkDrive(fileId) ''.concat( this.googleDrive , fileId , '/download' );
            const url = typeof fileId === 'number' ? getLinkDownload(fileId.toString(10)) : getLinkDrive(fileId);
            result = this.http.get(url, { responseType: 'blob' }).pipe(map(res => URL.createObjectURL(res)));
        }
        return result;
    }

    exportPdf() {
        // import('jspdf').then( jsPDF => {
        // 	import('jspdf-autotable').then( x => {
        // 		const doc = new jsPDF.default( 0 , 0 );
        // 		doc.autoTable( this.exportColumns , this.products );
        // 		doc.save( 'products.pdf' );
        // 	} );
        // } );
    }

    exportExcel(json: any[], fileName = 'anonymous') {
        import('xlsx').then(xlsx => {
            const worksheet = xlsx.utils.json_to_sheet(json);
            const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
            const excelBuffer: any = xlsx.write(workbook, { bookType: 'xlsx', type: 'array' });
            this.saveAsExcelFile(excelBuffer, fileName);
        });
    }

    saveAsExcelFile(buffer: any, fileName: string): void {
        const EXCEL_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
        const EXCEL_EXTENSION = '.xlsx';
        const data: Blob = new Blob([buffer], { type: EXCEL_TYPE });
        FileSaver.saveAs(data, fileName + EXCEL_EXTENSION);
    }

    isFolderStorageExist(): Observable<boolean> {
        return this.http.get(getLinkDrive('')).pipe(map(res => true), catchError((error) => of(false)));
    }

    getDriveStorageId(): Observable<any> {
        return this.http.get(getLinkDrive('')).pipe(map(res => res), catchError((error) => this.createFolderStorage()));
    }

    createFolderStorage(): Observable<string> {
        return this.http.post<{ data: { id: string } }>(getLinkDrive('storage'), '').pipe(map(res => res.data?.id ? res.data.id : ''));
    }

    //------------------------------by long------------------------------

    uploadFileAwsWidthProgressV2(file, tag: string = '', share?: number): Observable<Upload> {
        const initialState: Upload = { state: 'PENDING', progress: 0 }
        const calculateState = (upload: Upload, event: HttpEvent<unknown>): Upload => {
            if (this.isHttpProgressEvent(event)) {
                return {
                    progress: event.total
                        ? Math.round((100 * event.loaded) / event.total)
                        : upload.progress,
                    state: 'IN_PROGRESS',
                }
            }
            if (this.isHttpResponse(event)) {
                return {
                    progress: 100,
                    state: 'DONE',
                    content: event.body
                }
            }
            return upload
        }

        return this.http.post(getLinkMedia_aws(''), FileService.packFilesV2([file], tag, share ? share : 0), { reportProgress: true, observe: 'events' }).pipe(scan(calculateState, initialState));
    }
    uploadFileAwsV2(file, tag: string = '', share: number): Observable<OvicFile> {
        const fromObject = {};
        const params = new HttpParams({ fromObject });
        return this.http.post<Dto>(getLinkMedia_aws(''), FileService.packFilesV2([file], tag, share), { params: params }).pipe(
            retry(2),
            map(res => Array.isArray(res.data) ? res.data[0] : res.data)
        );
    }

}
