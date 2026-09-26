import {Injectable} from '@angular/core';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

@Injectable({
    providedIn: 'root'
})
export class ExportNoidongDecuongByHtmlService {

    constructor() {
    }

    async exportHtmlToWord(htmlContent:string, fileName?: string){
        try {
            const textContent = this.extractTextFromHtml(htmlContent);
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: textContent || 'Không có nội dung',
                                    break: 1
                                })
                            ]
                        })
                    ]
                }]
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, (fileName ?? 'document') + '.docx');
        } catch ( e ) {
            console.log( e );
        }
    }

    private extractTextFromHtml(htmlContent: string): string {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = htmlContent.replace(/<br\s*\/?>/gi, '\n');
        const text = wrapper.textContent ?? '';
        return text
            .replace(/\s+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    }


    // replaceContentCenter(htmlContent:string): any[]{
    //     const regex = /<p[^>]*>(.*?)<\/p>/g;
    //     let match;
    //     const contentArray = [];
    //
    //     while ((match = regex.exec(htmlContent)) !== null) {
    //         // Xóa các thẻ HTML con (như <span>, <o:p>) để lấy nội dung thuần túy
    //         const textContent = match[1].replace(/<[^>]*>/g, '').replace('&nbsp;','').trim();
    //         contentArray.push(textContent.replace('Chủ đề ','').trim());
    //     }
    //
    //     return contentArray;
    // }

    replaceContent(htmlContent:string): any[]{
        const regex = /<p[^>]*>(.*?)<\/p>/g;
        let match;
        const contentArray = [];

        while ((match = regex.exec(htmlContent)) !== null) {
            // Xóa các thẻ HTML con (như <span>, <o:p>) để lấy nội dung thuần túy
            const textContent = match[1].replace(/<[^>]*>/g, '').replace('&nbsp;','').trim();
            contentArray.push(textContent);
        }

        return contentArray;
    }
}
