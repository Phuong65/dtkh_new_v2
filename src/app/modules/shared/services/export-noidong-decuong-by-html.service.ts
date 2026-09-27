import {Injectable} from '@angular/core';
import { saveAs } from 'file-saver';
import { asBlob } from '@shared/vendor/html-docx/index';

@Injectable({
    providedIn: 'root'
})
export class ExportNoidongDecuongByHtmlService {

    constructor() {
    }

    async exportHtmlToWord(htmlContent:string, fileName?: string){
        try {
            const blob = await asBlob(htmlContent);
            saveAs(blob as Blob, (fileName ?? 'document') + '.docx');
        } catch ( e ) {
            console.log( e );
        }
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
