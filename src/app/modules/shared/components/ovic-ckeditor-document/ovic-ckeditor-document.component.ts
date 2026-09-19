import { Component, Input, OnChanges, OnInit, SimpleChanges, EventEmitter, Output, AfterViewInit, ViewChild, ElementRef, QueryList, TemplateRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import * as DecoupledEditor from './build/ckeditor';
import { firstValueFrom, forkJoin, Observable, of, Subscription } from 'rxjs';
import { APP_CONFIGS, environment, getLinkDownload, getLinkDownload_aws } from 'src/environments/environment';
import { OvicFileExplorerService } from '../../../shared/services/ovic-file-explorer.service';
import { OvicFileSever, OvicFileStore, OvicTree, OvicDriveFile, OvicFileUpload } from '@core/models/file';
import { DomSanitizer } from '@angular/platform-browser';
import { catchError, filter, map, mergeMap, tap } from 'rxjs/operators';
import { async } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { MAXIMIZE_MODAL_OPTIONS, OvicVideoSourceObject } from '../../utils/syscat';
import { request } from 'http';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';
import { NotificationService } from '@core/services/notification.service';
import { LatexHandleComponent } from '../latex-handle/latex-handle.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
    selector: 'ovic-ckeditor-document',
    templateUrl: './ovic-ckeditor-document.component.html',
    styleUrls: ['./ovic-ckeditor-document.component.css']
})

export class OvicCkeditorDocumentComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    countChange: number = 0;

    @ViewChild('templateEditor') templateEditor: ElementRef;

    @Input() formField: AbstractControl;

    @Input() changeId: number;

    @Input() filePublic: number = 0; //1 true

    @Input() autoSave = false;

    @Input() isMultipleMode = true;

    @Input() hasButtonSave = true;

    @Input() default: string;

    @Input() isReadOnly = false;

    @Input() toolBarPosition: TemplateRef<any>;

    @Input() styleClass: string;

    @Input() orientation = "portrait"; ///landscape

    @Input() gdriverId = environment.driveFolders.appData.children.lectureData.id;

    @Input() driveImage = environment.driveFolders.appData.children.lectureData.id;

    @Input() keyString: string;

    @Input() notes: { ten: string, id: string } = null;

    @Input() htmlKey = 'u'; //.

    @Input() attribute = 'data-key';

    @Input() toolbar = ['fullScreen', 'customInsertImage', '|', 'heading', '|', 'bold', 'italic', 'underline', 'removeFormat', 'customInsertLatex', 'insertTable', 'alignment', 'link', 'bulletedList', 'numberedList', 'mediaEmbed', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|', 'indent', 'outdent', 'specialCharacters', 'undo', 'redo', 'blockQuote', 'findAndReplace']; //'MathType' , 'ChemType'

    @Input() selectionRanges: any;

    @Input() tag: string = 'Không được xóa';

    @Output() onSaveData = new EventEmitter<any>();

    @Output() onChange = new EventEmitter<any>();

    @Output() onOpenDocument = new EventEmitter<any>();

    @Output() onClickElement = new EventEmitter<any>();

    @Output() onOpenNote = new EventEmitter<any>();

    @Output() getPosition = new EventEmitter<any>();

    @Output() dataIsReady = new EventEmitter<any>();

    @ViewChild('editorContent') editorContent: ElementRef;

    @ViewChild('editorToolbar') editorToolbar: ElementRef;

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

    openFileManager = false;

    Editor = DecoupledEditor;

    uploadImage = [];

    imageBase64 = [];

    haveWindow = false;

    userId: number;

    donviId: number;

    driver: string;

    neWOrientation: string;

    startProgress = false;

    clickNote = false;

    progressValue = 0;
    titleProgress = 'Đang tải file ảnh, xin vui lòng chờ...';

    heading = {
        options: [
            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
            // { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
            // { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
            { model: 'heading1', view: 'h2', title: 'Heading 1' },
            { model: 'heading2', view: 'h3', title: 'Heading 2' },
            // { model: 'heading3', view: 'h4', title: 'Heading 3' },
            // { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
            // { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
        ]
    }

    imageDrive = null;

    isMaximize = false;

    server = APP_CONFIGS.file_server;

    isReadyToLoad = false;
    constructor(
        private helperService: HelperService,
        private auth: AuthService,
        private fileService: FileService,
        private ovicFileExplorerService: OvicFileExplorerService,
        protected sanitizer: DomSanitizer,
        private modalService: NgbModal,
        private openFileManagerService: OpenFileManagerService,
        private noitifi: NotificationService,
        public matDialog: MatDialog,
        private el: ElementRef,
        private cd: ChangeDetectorRef
    ) {

    }
    ngOnDestroy(): void {
        this.imageDrive = this.driveImage;
        if (this.currentEditor) {
            this.currentEditor.destroy();
        }
    }

    ngOnInit(): void {
        this.donviId = this.auth.user.donvi_id;
        this.userId = this.auth.user.id;
        this.driver = this.gdriverId;
        this.neWOrientation = this.orientation
    }

    ngAfterViewInit() {
        this.initLazyLoad();
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

    createEditor() {
        this.Editor.create(this.editorContent.nativeElement,
            {
                toolbar: this.toolbar,
                table: this.tableOption,
                image: this.imageOption,
                removePlugins: ['SpecialCharactersArrows'],
                // heading: this.heading,
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
                        },
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
                        reversed: true,
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
                        { model: 'greenPen', class: 'pen-green marker-highlight', title: 'Green pen', color: 'var(--ck-highlight-pen-green)', type: 'pen' },
                        // { model: 'yellowMarkerComment', class: 'marker-yellow marker-highlight', title: 'Yellow Marker', color: 'var(--ck-highlight-marker-yellow)', type: 'marker' },
                    ]
                }
            },
        )
            .then(editor => {
                // const toolbarContainer = this.toolBarPosition.createEmbeddedView(editor.ui.view.toolbar.element);
                // toolbarContainer.context(editor.ui.view.toolbar.element);
                const commandImage = editor.commands.get('customInsertImage');
                commandImage.on('execute', (e) => {
                    this.onDisplayUpload();
                });
                const commandSave = editor.commands.get('customSave');
                commandSave.on('execute', (e) => {
                    this.saveDocument();
                });

                const commandNote = editor.commands.get('customNote');
                commandNote.on('execute', (e) => {
                    this.openNote();
                });

                const commandDocument = editor.commands.get('customDocument');
                commandDocument.on('execute', (e) => {
                    this.openDocument();
                });

                const commandLatex = editor.commands.get('customInsertLatex');

                commandLatex.on('execute', (e) => {
                    this.openLatexPopup();
                });

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

                editor.editing.view.document.on('click', (...args) => {
                    const lenght_string = editor.data.stringify(editor.model.getSelectedContent(editor.model.document.selection)).replace(/\&nbsp\;/gi, " ").length;
                    if (lenght_string) {
                        this.getPosition.emit({ start: editor.model.document.selection.getFirstRange().start.path, end: editor.model.document.selection.getFirstRange().end.path });
                    }


                    if (args && args[1] && args[1].target && args[1].target.name === this.htmlKey) {
                        if (args[1].target._attrs && args[1].target._attrs.get(this.attribute)) {
                            this.clickNote = false;
                            this.onClickRoot(args[1].target._attrs.get(this.attribute));
                        }
                    }

                    if (args && args[1] && args[1].target && args[1].target.name === this.htmlKey) {
                        if (args[1].target._attrs && args[1].target._attrs.get("data-note")) {
                            this.clickNote = true;
                            this.onClickRoot(args[1].target._attrs.get("data-note"));
                        }
                    }
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
                                const result = await firstValueFrom(this.fileService.uploadFileAws(file, 'image_question'));
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
                                const uploadedUrl = await firstValueFrom(this.fileService.uploadFileAws(file, 'image_question'));
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
                            const uploadedUrl = await firstValueFrom(this.fileService.uploadFileAws(file, 'image_question'));
                            this.insertImageIntoEditor(editor, uploadedUrl.id.toString());
                            evt.stop();
                            return;
                        }
                    }
                });

                this.currentEditor = editor;

                editor.model.document.on('change:data', (...args) => {
                    ++this.countChange;
                    this.onChangeData();
                });

                if (this.default) {
                    ++this.countChange;
                    editor.setData(this.default);
                }

                if (this.isReadOnly) {
                    this.currentEditor.enableReadOnlyMode('editor');
                } else {
                    this.currentEditor.disableReadOnlyMode('editor');
                }
            })
            .catch(err => {
                console.error(err);
            });
    }

    insertImageIntoEditor(editor, imageUrl) {
        if (editor) {
            editor.model.change(writer => {
                const imageElement = writer.createElement('imageBlock', {
                    src: imageUrl,
                    alt: imageUrl + '|' + this.server,
                });

                writer.setAttribute('dataOrg', this.server, imageElement);
                editor.model.insertContent(imageElement, editor.model.document.selection);
                this.noitifi.isProcessing(false);
            });
        }
    }

    svgBlobToPngFile(svgBlob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function () {
                const svgText = reader.result;
                const svg = new Blob([svgText], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(svg);
                const img = new Image();

                img.onload = function () {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width || 800;
                    canvas.height = img.height || 600;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    canvas.toBlob(blob => {
                        const file = new File([blob], 'converted.png', { type: 'image/png' });
                        resolve(file);
                    }, 'image/png');
                };

                img.onerror = reject;
                img.src = url;
            };

            reader.onerror = reject;
            reader.readAsText(svgBlob);
        });
    }

    cleanMsWordHtml(html) {
        return html
            // Remove Office conditional comments (VML, shapes, etc.)
            // .replace(/<!--\[if[\s\S]*?<!\[endif\]-->/gi, '')
            // .replace(/<!\[if !vml\]>|<!\[endif\]>/gi, '')
            .replace(/<v:[^>]+>[\s\S]*?<\/v:[^>]+>/gi, '') // remove <v:shape>, etc.
            .replace(/<o:[^>]+>[\s\S]*?<\/o:[^>]+>/gi, '') // remove <o:lock>, etc.
            .replace(/<xml[^>]*>[\s\S]*?<\/xml>/gi, '')
            // .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '') // remove embedded Word CSS

            // Remove Word-specific classes and inline styles
            // .replace(/\sclass="Mso[^"]*"/gi, '')
            // .replace(/\sstyle="[^"]*mso[^"]*"/gi, '')
            // .replace(/\sstyle="[^"]*"/gi, '') // optionally remove all inline styles

            // Remove span tags but keep inner content
            // .replace(/<\/?span[^>]*>/gi, '')

            // Remove lang attributes
            .replace(/\slang="[^"]*"/gi, '')

            // Remove empty paragraphs
            .replace(/<p[^>]*>(&nbsp;|\s)*<\/p>/gi, '')

            // Replace non-breaking space with normal space
            .replace(/&nbsp;/gi, ' ')
        // Clean up extra whitespace
        // .replace(/\s{2,}/g, ' ')
        // .replace(/[\r\n\t]+/g, '');
    }

    async onDisplayUpload() {
        try {
            const res = await this.openFileManagerService.openFileManagerNew({ isMultipleMode: true, ext: 'mp4,avi,png,jpg,mov', tag: this.tag });
            if (res && res.length) {
                res.forEach(f => {
                    this.afterChooseFile(f);
                })
            }

        } catch (e) {
            console.log(e);
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['default']) {
            if (!this.default) {
                if (this.currentEditor) {
                    this.currentEditor.setData('');
                }
            }
        }

        if (changes['default'] && changes['changeId']) {
            if (this.currentEditor) {
                this.currentEditor.setData(this.default ? this.default : '');
            }
        }

        if (changes['driveImage']) {
            this.imageDrive = this.driveImage;
        }

        if (changes['selectionRanges']) {
            if (this.selectionRanges && this.selectionRanges.length && this.currentEditor) {
                const objectRange = this.currentEditor.model.document.selection.getFirstRange();
                this.currentEditor.disableReadOnlyMode('editor');
                this.currentEditor.model.change(writer => {
                    this.selectionRanges.forEach(f => {
                        if (f.position) {
                            objectRange.start.path = f.position.start;
                            objectRange.start.stickiness = "toNext";
                            objectRange.end.path = f.position.end;
                            objectRange.end.stickiness = "toPrevious";
                            const range = writer.createRange(objectRange.start, objectRange.end);
                            writer.setSelection(range);
                            this.currentEditor.execute('highlight', { value: 'yellowMarker' });
                        }
                    })
                })
                if (this.isReadOnly) {
                    this.currentEditor.enableReadOnlyMode('editor');
                } else {
                    this.currentEditor.disableReadOnlyMode('editor');
                }
            }
        }

        if (changes['keyString'] && this.keyString) {
            if (this.currentEditor) {
                this.currentEditor.model.change(writer => {
                    const contentImage = "[".concat(this.keyString, "],\xa0")
                    writer.insert(contentImage, this.currentEditor.model.document.selection.focus);
                });
            }
        }

        if (changes['notes'] && this.notes) {
            if (this.currentEditor && this.notes.id) {
                this.currentEditor.model.change(writer => {
                    const htmlDP = this.currentEditor.data.processor;
                    const contentImage = '<u class="kyhieu_minhchung_in_baocao" data-note="' + this.notes.id + '">'.concat(this.notes.ten, '</u>,\xa0')
                    const content = contentImage;
                    const viewFragment = htmlDP.toView(content);
                    const modelFragment = this.currentEditor.data.toModel(viewFragment);
                    const toado = this.currentEditor.model.document.selection.focus.path[2] ? this.currentEditor.model.document.selection.focus.path[2] : this.currentEditor.model.document.selection.focus.path[1];
                    writer.insert(' ', this.currentEditor.model.document.selection.focus);
                    // this.currentEditor.model.document.selection.focus
                    this.currentEditor.model.document.selection.focus.path[1] = this.currentEditor.model.document.selection.focus.path[1] - 1;
                    writer.setSelection(writer.createPositionFromPath(this.currentEditor.model.document.getRoot(), this.currentEditor.model.document.selection.focus.path));
                    this.currentEditor.model.insertContent(modelFragment, this.currentEditor.model.document.selection.focus, 'before');
                    if (this.notes.ten && this.currentEditor.model.document.selection.focus.path) {
                        if (!toado) {
                            const position = writer.createPositionFromPath(this.currentEditor.model.document.getRoot(), this.currentEditor.model.document.selection.focus.path);
                            writer.setSelection(position);
                        } else {
                            if (this.currentEditor.model.document.selection.focus.path.length === 3) {
                                this.currentEditor.model.document.selection.focus.path[2] = this.currentEditor.model.document.selection.focus.path[2] + this.notes.ten.length + 2;
                            } else {
                                this.currentEditor.model.document.selection.focus.path[1] = this.currentEditor.model.document.selection.focus.path[1] + this.notes.ten.length + 2;
                            }
                            const position = writer.createPositionFromPath(this.currentEditor.model.document.getRoot(), this.currentEditor.model.document.selection.focus.path);
                            writer.setSelection(position);
                        }
                    }
                });
            }
        }

        if (changes['gdriverId']) {
            this.driver = this.gdriverId;
        }
    }


    afterChooseFile(file) {
        if (file) {
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

    saveDocument() {
        if (this.currentEditor) {
            if (this.currentEditor.getData()) {
                const data = this.currentEditor.getData();
                this.onSaveData.emit(data);
                if (this.formField) {
                    this.formField.setValue(data);
                }
            } else {
                this.onSaveData.emit("");
                if (this.formField)
                    this.formField.setValue("");
            }

        }
    }

    getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    onChangeData() {
        this.onChange.emit(this.currentEditor.getData());
        if (this.autoSave) {
            this.saveDocument()
        }
    }

    openDocument() {
        this.onOpenDocument.emit();
    }

    onClickRoot(id: any) {
        this.onClickElement.emit({ kyhieu: id, note: this.clickNote });
    }

    openNote() {
        this.onOpenNote.emit();
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
