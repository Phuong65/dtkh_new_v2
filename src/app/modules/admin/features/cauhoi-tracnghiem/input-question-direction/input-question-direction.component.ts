import { data } from 'autoprefixer';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';

import { APP_CONFIGS, getLinkDownload, getLinkDownload_aws } from '@env';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { OvicFileExplorerService } from '@shared/services/ovic-file-explorer.service';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OpenFileManagerService } from '@shared/services/open-file-manager.service';
import { OvicVideoSourceObject } from '@shared/utils/syscat';
import DecoupledEditor from '../../../../shared/components/ovic-ckeditor-document/build/ckeditor';
import { AbstractControl } from '@angular/forms';
import { Answers } from '@shared/models/question';
import { LatexHandleService } from '@modules/shared/services/latex-handle.service';
import { catchError, firstValueFrom, forkJoin, fromEvent, map, mergeMap, Observable, of } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { eventListeners } from '@popperjs/core';
import { LoadMediaOnTextDirective } from '@modules/shared/directives/load-media-on-text.directive';
import { KatexDirective } from '@modules/shared/directives/katex.directive';
import { LatexHandleComponent } from '@modules/shared/components/latex-handle/latex-handle.component';
import { MatDialog } from '@angular/material/dialog';
import katex from 'katex'
import { KatexImgDirective } from '@modules/shared/directives/katex-img.directive';
import { SkeletonModule } from 'primeng/skeleton';


@Component({
    selector: 'app-input-question-direction',
    standalone: true,
    imports: [
    LoadMediaOnTextDirective,
    KatexImgDirective,
    SkeletonModule
],
    templateUrl: './input-question-direction.component.html',
    styleUrls: ['./input-question-direction.component.css']
})
export class InputQuestionDirectionComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {

    countChanges = 0;

    @Input() public = 0;

    @Input() abstractControl: AbstractControl<any>;

    @Input() id_change: number;

    @Input() htmlInputModel: Answers;

    @Input() styleClass: string = '';

    @Input() toolbar = ['fullScreen', 'customInsertImage', '|', 'heading', '|', 'bold', 'italic', 'underline', 'removeFormat', 'customInsertLatex', 'codeBlock', 'insertTable', 'alignment', 'link', 'bulletedList', 'numberedList', 'mediaEmbed', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|', 'indent', 'outdent', 'specialCharacters', 'undo', 'redo', 'blockQuote', 'findAndReplace'];

    @ViewChild('editorContent') editorContent: ElementRef;

    @Output() ckEditor: EventEmitter<any> = new EventEmitter<any>();

    tableOption = { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableproperties', 'tableCellProperties', 'toggleTableCaption'] };

    imageOption = {
        styles: ['alignLeft', 'alignCenter', 'alignRight'],
        resizeUnit: 'px',
        resizeOptions: [
            {
                name: 'resizeImage:original',
                label: 'Original',
                value: null
            },
            {
                name: 'resizeImage:100',
                label: '100pt',
                value: '100'
            },
            {
                name: 'resizeImage:200',
                label: '200pt',
                value: '200'
            }
        ],
        toolbar: [
            'imageStyle:alignLeft', 'imageStyle:alignCenter', 'imageStyle:alignRight',
            '|',
            'imageResize',
            '|',
            'toggleImageCaption'
        ]
    };

    currentEditor: any;

    Editor = DecoupledEditor;

    heading = {
        options: [
            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
            { model: 'heading1', view: 'h2', title: 'Heading 1' },
            { model: 'heading2', view: 'h3', title: 'Heading 2' }
        ]
    };

    uploadImage = [];

    server = APP_CONFIGS.file_server;

    changeData = true;

    isReadyToLoad = false;

    constructor(
        private helperService: HelperService,
        private auth: AuthService,
        private fileService: FileService,
        private ovicFileExplorerService: OvicFileExplorerService,
        protected sanitizer: DomSanitizer,
        private modalService: NgbModal,
        private openFileManagerService: OpenFileManagerService,
        private latexHandleService: LatexHandleService,
        private noitifi: NotificationService,
        public matDialog: MatDialog,
        private el: ElementRef,
        private cd: ChangeDetectorRef
    ) { }

    ngOnChanges(changes: SimpleChanges): void {

    }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        if (this.currentEditor) {
            this.currentEditor.destroy();
        }
    }

    ngAfterViewInit(): void {
        this.isReadyToLoad = true;
        this.cd.detectChanges();
        this.createEditor();
    }

    initLazyLoad(): void {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                this.isReadyToLoad = true;
                this.cd.detectChanges();
                this.createEditor();
                observer.disconnect();
            }
        }, {
            rootMargin: '100px',
            threshold: 0.1
        });

        observer.observe(this.el.nativeElement);
    }

    createEditor(): void {
        this.Editor.create(this.editorContent.nativeElement,
            {
                toolbar: this.toolbar,
                table: this.tableOption,
                image: this.imageOption,
                removePlugins: ['SpecialCharactersArrows'],
                link: {
                    decorators: {
                        isExternal: {
                            mode: 'automatic',
                            callback: url => {
                            },
                            attributes: {
                                target: '#',
                                rel: 'noopener noreferrer'
                            }
                        }
                    }
                },
                htmlSupport: {
                    allow: [
                        {
                            name: /.*/,
                            attributes: true,
                            classes: true,
                            styles: false
                        }
                    ]
                },
                list: {
                    properties: {
                        styles: true,
                        startIndex: true,
                        reversed: true
                    }
                },
                indentBlock: {
                    classes: [
                        'custom-block-indent-a', // First step - smallest indentation.
                        'custom-block-indent-b',
                        'custom-block-indent-c'  // Last step - biggest indentation.
                    ]
                },
                highlight: {
                    options: [
                        { model: 'yellowMarker', class: 'marker-yellow marker-highlight', title: 'Yellow Marker', color: 'var(--ck-highlight-marker-yellow)', type: 'marker' },
                        { model: 'greenMarker', class: 'marker-green marker-highlight', title: 'Green marker', color: 'var(--ck-highlight-marker-green)', type: 'marker' },
                        { model: 'pinkMarker', class: 'marker-pink marker-highlight', title: 'Pink marker', color: 'var(--ck-highlight-marker-pink)', type: 'marker' },
                        { model: 'blueMarker', class: 'marker-blue marker-highlight', title: 'Blue marker', color: 'var(--ck-highlight-marker-blue)', type: 'marker' },
                        { model: 'redPen', class: 'pen-red marker-highlight', title: 'Red pen', color: 'var(--ck-highlight-pen-red)', type: 'pen' },
                        { model: 'greenPen', class: 'pen-green marker-highlight', title: 'Green pen', color: 'var(--ck-highlight-pen-green)', type: 'pen' }
                    ]
                },
            }
        ).then(editor => {
            const commandImage = editor.commands.get('customInsertImage');

            commandImage.on('execute', (e) => {
                this.onDisplayUpload();
            });

            /** latex */
            const commandLatex = editor.commands.get('customInsertLatex');

            commandLatex.on('execute', (e) => {
                this.openLatexPopup();
            });



            /**end */

            editor.editing.view.document.on('click', (evt, data) => {

                const viewElement = data.target;

                const domElement = editor.editing.view.domConverter.viewToDom(viewElement);

                const latexWrapper = domElement.closest('.latex-ictu-img');

                if (latexWrapper) {
                    const latexValue = latexWrapper.getAttribute('data-latex');
                    this.openLatexPopup(latexValue, latexWrapper);
                }
            });

            editor.model.schema.extend('imageBlock', {
                allowAttributes: ['dataOrg']
            });

            editor.conversion.for('downcast').add(dispatcher => {
                dispatcher.on('attribute:data-org:imageBlock', (evt, data, conversionApi) => {
                    const viewWriter = conversionApi.writer;
                    const viewElement = conversionApi.mapper.toViewElement(data.item);

                    if (viewElement) {
                        viewWriter.setAttribute('data-org', data.newValue, viewElement);
                    }
                });
            });

            editor.conversion.for('upcast').attributeToAttribute({
                view: {
                    name: 'img',
                    key: 'data-org'
                },
                model: 'data-org'
            });

            editor.plugins.get('ClipboardPipeline').on('inputTransformation', async (evt, data) => {
                if (!data.content || data.method !== 'paste') return;

                const html = data.dataTransfer.getData('text/html');

                if (!html) return;

                const parser = new DOMParser();

                const doc = parser.parseFromString(html, 'text/html');

                const images: any = doc.querySelectorAll('img');

                if (images.length === 0) return;

                evt.stop();

                this.noitifi.isProcessing(true);

                for (const img of images) {
                    const src = img.src;
                    const alt = img.alt;

                    if (src.startsWith('data:image/')) {
                        try {
                            const file = this.helperService.convertFileFromBase64(src, '(copy_from_word)', true);
                            const result = await firstValueFrom(this.fileService.uploadFileAws(file, 'image_question', this.public));
                            img.setAttribute('src', result.id.toString());
                            img.setAttribute('alt', result.id.toString().concat("|", this.server));
                            img.setAttribute('data-org', this.server);
                        } catch (err) {
                            console.error('Upload failed:', err);
                        }
                    } else if (src.startsWith('http') && (!alt || alt.indexOf(this.server) === -1)) {
                        img.setAttribute("src", "assets/images/image_online_https.PNG");
                        img.setAttribute("class", "image_online_https");

                        const link = doc.createElement('a');
                        link.setAttribute('href', src);
                        link.setAttribute('target', '_blank');

                        img.parentNode.insertBefore(link, img);
                        link.appendChild(img);
                    }
                }

                const cleanedHtml = this.cleanMsWordHtml(doc.body.innerHTML);
                const viewFragment = editor.data.processor.toView(cleanedHtml);
                const modelFragment = editor.data.toModel(viewFragment);

                editor.model.change(writer => {
                    editor.model.insertContent(modelFragment, editor.model.document.selection);
                });

                this.noitifi.isProcessing(false);
            });

            editor.editing.view.document.on('paste', async (evt, data) => {
                const clipboardData = data.domEvent.clipboardData;
                if (!clipboardData) return;

                const htmlData = clipboardData.getData('text/html');

                const plainText = clipboardData.getData('text/plain');

                const latexRegex = /(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

                if (htmlData && htmlData.includes('class="katex"')) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlData, 'text/html');
                    const katexElements = doc.querySelectorAll('.katex');

                    if (katexElements.length > 0) {
                        evt.stop();
                        katexElements.forEach(el => {
                            const rawLatex = el.querySelector('annotation')?.textContent ||
                                el.querySelector('img')?.getAttribute('alt') || "";

                            if (rawLatex) {
                                const span = doc.createElement('span');
                                span.className = 'latex-ictu-img';
                                span.setAttribute('data-latex', rawLatex.trim());
                                span.innerHTML = '<img src="assets/images/image-loading-2.gif" style="vertical-align: middle;"/>';
                                el.replaceWith(span);
                            }
                        });

                        const viewFragment = editor.data.processor.toView(doc.body.innerHTML);
                        const modelFragment = editor.data.toModel(viewFragment);
                        editor.model.insertContent(modelFragment, editor.model.document.selection);
                        return;
                    }
                }

                if (plainText && latexRegex.test(plainText)) {
                    evt.stop();

                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlData || plainText;

                    const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT, null);
                    let nodesToReplace = [];
                    let currentNode;

                    while (currentNode = walker.nextNode()) {
                        if (latexRegex.test(currentNode.nodeValue)) {
                            nodesToReplace.push(currentNode);
                        }
                    }

                    nodesToReplace.forEach(node => {
                        const fragment = document.createDocumentFragment();
                        const parts = node.nodeValue.split(latexRegex);

                        parts.forEach(part => {
                            if (part.match(latexRegex)) {
                                const cleanLatex = part
                                    .replace(/^\$\$|\$\$$|^\$|\$$/g, '')
                                    .replace(/^\\\[|\\\]$/g, '')
                                    .replace(/^\\\(|\\\)$/g, '')
                                    .trim();

                                const span = document.createElement('span');
                                span.className = 'latex-ictu-img';
                                span.setAttribute('data-latex', cleanLatex);
                                span.innerHTML = '<img src="assets/images/image-loading-2.gif" style="vertical-align: middle;"/>';
                                fragment.appendChild(span);
                                fragment.appendChild(document.createTextNode('\u00A0')); // Dấu cách trắng
                            } else {
                                fragment.appendChild(document.createTextNode(part));
                            }
                        });
                        node.parentNode.replaceChild(fragment, node);
                    });

                    const viewFragment = editor.data.processor.toView(tempDiv.innerHTML);
                    const modelFragment = editor.data.toModel(viewFragment);
                    editor.model.insertContent(modelFragment, editor.model.document.selection);
                }

                if (htmlData && htmlData.includes('<svg')) {
                    this.noitifi.isProcessing(true);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlData, 'text/html');
                    const svgEl = doc.querySelector('svg');
                    if (svgEl) {
                        const svgText = svgEl.outerHTML;
                        const blob = new Blob([svgText], { type: 'image/svg+xml' });
                        const file = new File([blob], 'pasted.svg', { type: 'image/svg+xml' });
                        if (file.size > 0) {
                            const uploadedUrl = await firstValueFrom(this.fileService.uploadFileAws(file, 'image_question', this.public));
                            this.insertImageIntoEditor(editor, uploadedUrl.id.toString());
                            evt.stop();
                            return;
                        }
                    }
                }

                for (const item of clipboardData.items) {
                    if (!item.type.startsWith('image/')) continue;
                    const file = item.getAsFile();
                    if (file && file.size > 0) {
                        const uploadedUrl = await firstValueFrom(this.fileService.uploadFileAws(file, 'image_question', this.public));
                        this.insertImageIntoEditor(editor, uploadedUrl.id.toString());
                        evt.stop();
                        return;
                    }
                }
            });

            editor.model.document.on('change', () => {
                this.setDataChange(editor);
                ++this.countChanges;
            });

            if (this.abstractControl && this.abstractControl.value) {
                editor.data.set(this.abstractControl.value);
            } else if (this.htmlInputModel) {
                editor.data.set(this.htmlInputModel.value);
                ++this.countChanges;
            }

            this.currentEditor = editor;

            this.ckEditor.emit(editor);

        }).catch((err: any) => console.error(err));
    }

    insertImageIntoEditor(editor, imageUrl) {
        editor.model.change(writer => {
            const imageElement = writer.createElement('imageBlock', {
                src: imageUrl,
                alt: imageUrl + '|' + this.server,
                'data-org': this.server
            });

            editor.model.insertContent(imageElement, editor.model.document.selection);

            this.noitifi.isProcessing(false);
        });
    }

    cleanMsWordHtml(html) {
        return html
            .replace(/<v:[^>]+>[\s\S]*?<\/v:[^>]+>/gi, '')
            .replace(/<o:[^>]+>[\s\S]*?<\/o:[^>]+>/gi, '')
            .replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '')
            .replace(/\slang="[^"]*"/gi, '')
            .replace(/<p[^>]*>(&nbsp;|\s)*<\/p>/gi, '')
            .replace(/&nbsp;/gi, ' ')
    }

    setDataChange(editor) {
        if (editor && editor.getData()) {

            const data = editor.getData();

            this.noitifi.isProcessing(false);

            if (this.abstractControl) {
                this.abstractControl.setValue(data);
            }

            if (this.htmlInputModel) {
                this.htmlInputModel.value = data;
            }

        } else {
            this.noitifi.isProcessing(false);

            if (this.abstractControl) {
                this.abstractControl.setValue('');
            }

            if (this.htmlInputModel) {
                this.htmlInputModel.value = '';
            }
        }
    }

    getImageSize(arrayIdImages: any): Promise<any> {
        if (arrayIdImages && arrayIdImages.length !== 0) {
            return new Promise((resolve, reject) => {
                const fileUploadRes: Observable<any>[] = [];
                if (arrayIdImages.length !== 0) {
                    arrayIdImages.forEach((f, index) => {
                        fileUploadRes.push(this.loadImage(f.blob).pipe(mergeMap(_img => {
                            f.image_tag = _img;
                            return of(_img);
                        })));
                    });
                }

                if (fileUploadRes.length !== 0) {
                    forkJoin(fileUploadRes).subscribe({
                        next: (forkRes: any) => {
                            resolve(arrayIdImages);
                        },
                        error: () => {
                            () => this.noitifi.toastError('Thêm câu hỏi thất bại');
                            this.noitifi.isProcessing(false);
                        }
                    });
                }
            });
        } else {
            return null;
        }
    }

    loadImage(imagePath) {
        return new Observable((observer) => {
            let img = new Image();
            img.src = imagePath;
            img.onload = function () {
                observer.next(img);
                observer.complete();
            }
            img.onerror = function (err) {
                observer.error(err);
            }
        })
    }


    getImageFile(arrayIdImages: any): Promise<any> {
        if (arrayIdImages && arrayIdImages.length !== 0) {
            return new Promise((resolve, reject) => {
                const fileUploadRes: Observable<any>[] = [];
                if (arrayIdImages.length !== 0) {
                    arrayIdImages.forEach((f, index) => {
                        fileUploadRes.push(this.loadBase64(f.blob).pipe(mergeMap(_img => {
                            f.file = _img;
                            return of(_img);
                        })));
                    });
                }

                if (fileUploadRes.length !== 0) {
                    forkJoin(fileUploadRes).subscribe({
                        next: (forkRes: any) => {
                            resolve(arrayIdImages);
                        },
                        error: () => {
                            () => this.noitifi.toastError('Thêm câu hỏi thất bại');
                            this.noitifi.isProcessing(false);
                        }
                    });
                }
            });
        } else {
            return null;
        }
    }

    loadBase64(blob) {
        const currentThis = this;
        return new Observable((observer) => {
            let reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = function () {
                let base64data = reader.result;
                const file = currentThis.helperService.convertFileFromBase64(base64data.toString(), '(copy_from_word)', true);
                observer.next(file);
                observer.complete();
            }
        })
    }

    loadChangeData(editor): Promise<any> {
        return new Promise((resolve, reject) => {
            editor.model.document.on('change:data', (evt, data) => {
                resolve(editor.getData);
            });
        });
    }




    async onDisplayUpload() {
        try {
            const res = await this.openFileManagerService.openFileManagerNew({ isMultipleMode: true, ext: 'mp4,avi,png,jpg,mov', tag: 'question' });
            if (res && res.length) {
                res.forEach(f => {
                    this.afterChooseFile(f);
                });
            }
        } catch (e) {
            console.log(e);
        }
    }

    afterChooseFile(file): void {
        if (file) {
            if (this.currentEditor) {
                let src = null;
                switch (this.server) {
                    case OvicVideoSourceObject.serverAws:
                        src = getLinkDownload_aws(file.path.toString().concat('?token=', this.auth.accessToken));
                        break;
                    case OvicVideoSourceObject.serverFile:
                        src = getLinkDownload(file.path.toString().concat('?token=', this.auth.accessToken));
                        break;
                    default:
                        break;
                }
                this.convertData(src, file);
            }
        }
    }

    convertData(blob: string, file) {
        this.currentEditor.model.change(writer => {
            const htmlDP = this.currentEditor.data.processor;
            const index = this.uploadImage.findIndex(m => m.id === file['id']);
            if (index === -1) {
                this.uploadImage.push({
                    id: file.id,
                    blob: blob
                });
            }

            const image = writer.createElement('image', {
                src: blob,
                alt: file.id
            });

            const content: string = '<figure class="image ck-widget ck-widget_with-resizer image_resized ck-widget_selected" contenteditable="false"><img data-org="' + this.server + '" src="' + file.id + '" alt="' + file.id + '|' + this.server + '" size="100px"/>< /figure>';
            const viewFragment = htmlDP.toView(content);
            const modelFragment = this.currentEditor.data.toModel(viewFragment);
            this.currentEditor.model.insertContent(modelFragment, this.currentEditor.model.document.selection.focus, 'before');
        });
    }

    blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader: FileReader = new FileReader;
            reader.onerror = () => resolve(null);
            reader.onload = () => resolve(reader.result.toString());
            reader.readAsDataURL(blob);
        });
    }

    openLatexPopup(latex?: string, latexWrapper?: string) {
        const dialogRef = this.matDialog.open(LatexHandleComponent, {
            width: '700px',
            data: { formula: latex ? latex : '' }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result || result === '') {
                if (this.currentEditor && latexWrapper) {

                    const viewElement = this.currentEditor.editing.view.domConverter.domToView(latexWrapper);

                    const modelRange = this.currentEditor.editing.mapper.toModelRange(
                        this.currentEditor.editing.view.createRangeOn(viewElement)
                    );

                    if (modelRange) {
                        this.currentEditor.model.change(writer => {
                            const insertPosition = modelRange.start;

                            writer.remove(modelRange);

                            writer.setSelection(insertPosition);
                        });
                    } else {
                        this.currentEditor.execute('delete');
                    }
                }

                if (result !== '')
                    this.insertLatexString(result);
            }
        });
    }

    insertLatexString(content: string) {
        if (!this.currentEditor) return;

        const editor = this.currentEditor;

        const htmlDP = editor.data.processor;

        editor.model.change(writer => {
            const viewFragment = htmlDP.toView(content);
            const modelFragment = editor.data.toModel(viewFragment);
            editor.model.insertContent(modelFragment, editor.model.document.selection);
            const lastChild = modelFragment.getChild(modelFragment.childCount - 1);
            if (lastChild) {
                const endPosition = writer.createPositionAfter(lastChild);
                writer.setSelection(endPosition);
            }
        });

        editor.editing.view.focus();
    }
}
