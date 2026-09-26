import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';

import { APP_CONFIGS, getLinkDownload, getLinkDownload_aws } from '@env';
import { HelperService } from '@core/services/helper.service';
import { AuthService } from '@core/services/auth.service';
import { FileService } from '@core/services/file.service';
import { OvicFileExplorerService } from '@shared/services/ovic-file-explorer.service';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { OpenFileManagerService } from '@shared/services/open-file-manager.service';
import { OvicVideoSourceObject } from '@shared/utils/syscat';
import * as DecoupledEditor from '../../../../shared/components/ovic-ckeditor-document/build_v2/ckeditor';
import { AbstractControl } from '@angular/forms';
import { LatexHandleService } from '@modules/shared/services/latex-handle.service';

@Component({
    selector: 'app-input-question-direction',
    standalone: true,
    imports: [],
    templateUrl: './input-question-direction.component.html',
    styleUrls: ['./input-question-direction.component.css']
})
export class InputQuestionDirectionComponent implements OnInit, OnDestroy {

    @Input() abstractControl: AbstractControl<any>;

    @Input() styleClass: string = '';

    @Input() toolbar = ['fullScreen', 'customInsertImage', '|', 'heading', '|', 'bold', 'italic', 'underline', 'removeFormat', 'insertTable', 'alignment', 'link', 'bulletedList', 'numberedList', 'mediaEmbed', 'fontFamily', 'fontColor', 'fontBackgroundColor', '|', 'indent', 'outdent', 'specialCharacters', 'undo', 'redo', 'blockQuote', 'findAndReplace'];

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
            // { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
            // { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
            { model: 'heading1', view: 'h2', title: 'Heading 1' },
            { model: 'heading2', view: 'h3', title: 'Heading 2' }
            // { model: 'heading3', view: 'h4', title: 'Heading 3' },
            // { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
            // { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
        ]
    };

    uploadImage = [];

    server = APP_CONFIGS.file_server;

    constructor(
        private helperService: HelperService,
        private auth: AuthService,
        private fileService: FileService,
        private ovicFileExplorerService: OvicFileExplorerService,
        protected sanitizer: DomSanitizer,
        private modalService: NgbModal,
        private openFileManagerService: OpenFileManagerService,
        private latexHandleService: LatexHandleService
    ) { }

    ngOnInit(): void {

    }

    ngOnDestroy(): void {
        if (this.currentEditor) {
            this.currentEditor.destroy();
        }
    }

    ngAfterViewInit(): void {
        this.createEditor();
    }

    createEditor(): void {
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
                        // { model: 'yellowMarkerComment', class: 'marker-yellow marker-highlight', title: 'Yellow Marker', color: 'var(--ck-highlight-marker-yellow)', type: 'marker' },
                    ]
                }
            }
        ).then(editor => {
            // editor.model.document.on( 'change:data' , () => {
            // 	console.log( 'The data has changed!' );
            // } );
            editor.model.document.on('change', () => {
                if (this.abstractControl) {
                    this.abstractControl.setValue(editor.getData());
                }
            });
            // const toolbarContainer = this.toolBarPosition.createEmbeddedView(editor.ui.view.toolbar.element);
            // toolbarContainer.context(editor.ui.view.toolbar.element);
            const commandImage = editor.commands.get('customInsertImage');
            commandImage.on('execute', (e) => {
                this.onDisplayUpload();
            });

            const commandLatex = editor.commands.get('customLatex');
            commandLatex.on('execute', (e) => {
                this.onLatexLayoutDisplay();
            });

            if (this.abstractControl) {
                editor.data.set(this.abstractControl.value);
                
                
                
            }

            this.currentEditor = editor;
            this.ckEditor.emit(editor);
        }).catch((err: any) => console.error(err));
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

            const content: string = '<figure class="image ck-widget ck-widget_with-resizer image_resized ck-widget_selected" contenteditable="false"><img data-org="' + this.server + '" src="' + blob + '" alt="' + file.id + '|' + this.server + '" size="100px"/>< /figure>';
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

    async onLatexLayoutDisplay() {
        try {
            const res = await this.latexHandleService.openLatex();
            if (res) {
                return this.writeLatexOnedit(res);
            }
        } catch (e) {
            console.log(e);
        }
    }

    writeLatexOnedit(latex: string) {
        this.currentEditor.model.change(async writer => {
            const htmlDP = this.currentEditor.data.processor;
            const date = new Date();
            const content: string = '$'+date.getTime()+'$' ;
            const viewFragment = htmlDP.toView(content);
            const modelFragment = this.currentEditor.data.toModel(viewFragment);
            await this.currentEditor.model.insertContent(modelFragment, this.currentEditor.model.document.selection.focus, 'before');
            this.currentEditor.updateSourceElement();
            const data = this.currentEditor.getData();
            const data_ = data.replace(content, latex);
            this.currentEditor.setData(data_);
            // writer.appendHtml('<span>aaa</span>')
            // console.log(this.currentEditor.document.getElementById(date.getTime().toString()));
            // document.getElementById(date.getTime().toString()).innerText='aaaaa';
        });
    }



}
