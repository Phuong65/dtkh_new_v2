
import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';
import { Classes } from "@shared/models/classes";
import { CoursePlanActivities } from "@shared/models/course-plan-activities";
import {
    AlignmentType,
    BorderStyle,
    File,
    Footer,
    Packer,
    PageNumber,
    Paragraph,
    Table,
    TableCell,
    TableRow,
    TextRun,
    UnderlineType,
    WidthType
} from 'docx';
import { APP_CONFIGS, key_server } from '@env';
import {
    PercentScore
} from "@modules/admin/features/lop-hoc-phan/class-details/thong-ke-diemthuongxuyen-hvu/thong-ke-diemthuongxuyen-hvu.component";
import { KEY_ANSWER_new } from '../utils/syscat';


@Injectable({
    providedIn: 'root'
})
export class ExportDiemthuongxuyenV3Service {

    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    fileExtension = '.xlsx';

    KEY_ANSWER_new = KEY_ANSWER_new;
    constructor() {

    }



    private saveExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: this.fileType });
        FileSaver.saveAs(data, fileName + this.fileExtension);
    }

    exportExcel(
        data1: any[],
        data2: any[],
        clases: any,
        fileName: string,
        weekUse: number,
        header1: any[],
        header2: any[],
        tongKtKyNang: number,
        config_diem: any
    ): Promise<void> {
        config_diem = config_diem || {};
        tongKtKyNang = Math.max(1, Number(tongKtKyNang) || 1);
        const sotinchi = parseInt(clases['sotinchi']);
        const txRatio = config_diem['tx'] !== undefined ? config_diem['tx'] : config_diem['kynang'];
        const wb = new exceljs.Workbook();
        if (data1 && sotinchi) {
            const ws = wb.addWorksheet('BangDiemTX');
            // ws.eachRow((row) => {row.eachCell((cell) => {cell.font = { name: 'Times New Roman' };});});
            ws.addRow('')
            ws.mergeCells('A1:C1');
            ws.getCell('A1', 'C1').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A1', 'C1').value = 'ĐẠI HỌC THÁI NGUYÊN';
            ws.getCell('A1', 'C1').font = { name: 'Times New Roman', size: 10 };

            if (sotinchi === 2) {

                ws.mergeCells('E1:J1');
                ws.getCell('E1:J1').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E1:J1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
                ws.getCell('E1:J1').font = { name: 'Times New Roman', bold: true, size: 10 }
            }
            if (sotinchi === 3) {
                ws.mergeCells('E1:K1');
                ws.getCell('E1:K1').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E1:K1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
                ws.getCell('E1:K1').font = { name: 'Times New Roman', bold: true, size: 10 };
            }


            ws.addRow('');
            ws.mergeCells('A2:C2');
            ws.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center', };
            ws.getCell('A2').value = 'TRƯỜNG ĐH CNTT VÀ TRUYỀN THÔNG';
            ws.getCell('A2').font = { underline: true, bold: true, name: 'Times New Roman', size: 10 };
            if (sotinchi === 2) {
                ws.mergeCells('E2:J2');
                ws.getCell('E2:J2').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E2:J2').value = 'Độc lập - Tự do - Hạnh phúc';
                ws.getCell('E2:J2').font = { underline: true, bold: true, size: 10, name: 'Times New Roman' };
            }
            if (sotinchi === 3) {
                ws.mergeCells('E2:K2');
                ws.getCell('E2:K2').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E2:K2').value = 'Độc lập - Tự do - Hạnh phúc';
                ws.getCell('E2:K2').font = { underline: true, bold: true, size: 10, name: 'Times New Roman' };
            }


            ws.addRow('');
            ws.mergeCells('A3:K3');
            ws.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A3').value = 'BẢNG GHI ĐIỂM THƯỜNG XUYÊN';
            ws.getCell('A3').font = { underline: false, bold: true, size: 13, name: 'Times New Roman' };

            ws.addRow('');
            ws.mergeCells('B4:D4');
            ws.getCell('B4:D4').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('B4:D4').value = 'Lớp học phần: ' + clases['name'];
            ws.getCell('B4:D4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.mergeCells('E4:G4');
            ws.getCell('E4:G4').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('E4:G4').value = 'Học kỳ: ' + clases['hocky'];
            ws.getCell('E4:G4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.mergeCells('H4:K4');
            ws.getCell('H4:K4').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('H4:K4').value = 'Năm học: ' + clases['namhoc'];
            ws.getCell('H4:K4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };

            ws.addRow(' ');
            ws.mergeCells('B5:J5');
            ws.getCell('B5:J5').value = "Học Phần: " + clases['show_mon'];
            ws.getCell('B5:J5').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.getCell('B5:J5').alignment = { vertical: 'middle', horizontal: "left" };

            ws.addRow('');
            // ws.mergeCells('A6:K6');
            let cell = ws.getCell('A6');
            cell.value = 'Giáo viên dùng danh sách này để:';
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { bold: true, size: 12, name: 'Times New Roman' };


            ws.addRow('');
            ws.mergeCells('A7:K7');
            ws.getCell('A7').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('A7').value = '       1. Ghi điểm các bài kiểm tra thường xuyên, điểm đánh giá ý thức học tập cho sinh viên';
            ws.getCell('A7').font = { bold: false, size: 12, name: 'Times New Roman' };

            ws.addRow('');
            ws.mergeCells('A8:K8');
            ws.getCell('A8').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('A8').value = '       2. Nộp lại cho Khoa/Bộ môn sau khi kết thúc giảng dạy học phần.';
            ws.getCell('A8').font = { bold: false, size: 12, name: 'Times New Roman' };
            // ws.getRow(8).height= 100;

            // ws.addRow('');
            ws.addRow('');
            ws.mergeCells('A9:A10');
            ws.getCell('A9:A10').value = 'STT';
            ws.getCell('A9:A10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('A9:A10').font = { bold: true, size: 12, name: 'Times New Roman', };
            ws.getCell('A9:A10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('B9:B10');
            ws.getCell('B9:B10').value = 'Mã SV';
            ws.getCell('B9:B10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('B9:B10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('B9:B10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('C9:C10');
            ws.getCell('C9:C10').value = 'Họ và Tên';
            ws.getCell('C9:C10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('C9:C10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('C9:C10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('D9:D10');
            ws.getCell('D9:D10').value = 'Ngày sinh';
            ws.getCell('D9:D10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('D9:D10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('D9:D10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            if (sotinchi === 2) {
                ws.mergeCells('E9:H9');
                ws.getCell('E9:H9').value = 'Điểm';
                ws.getCell('E9:H9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('E9:H9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('E9:H9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }
            if (sotinchi === 3) {
                ws.mergeCells('E9:I9');
                ws.getCell('E9:I9').value = 'Điểm';
                ws.getCell('E9:I9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('E9:I9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('E9:I9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }
            if (sotinchi === 4) {
                ws.mergeCells('E9:J9');
                ws.getCell('E9:J9').value = 'Điểm';
                ws.getCell('E9:J9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('E9:J9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('E9:J9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            }

            ws.getCell('E10').value = 'C.CẦN';
            ws.getCell('E10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('E10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('E10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            ws.getCell('F10').value = 'TB CÁC BÀI TEST';
            ws.getCell('F10').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
            ws.getCell('F10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('F10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            if (sotinchi === 2) {
                ws.getCell('G10').value = 'BÀI 1';
                ws.getCell('G10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('G10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('G10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('H10').value = 'BÀI 2';
                ws.getCell('H10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('H10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('H10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('I9:I10');
                ws.getCell('I9:I10').value = 'CC';
                ws.getCell('I9:I10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('I9:I10').font = { bold: true, size: 10, name: 'Times New Roman', };
                ws.getCell('I9:I10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('J9:J10');
                ws.getCell('J9:J10').value = 'Ghi chú';
                ws.getCell('J9:J10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('J9:J10').font = { bold: true, size: 10, name: 'Times New Roman', };
                ws.getCell('J9:J10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

            }
            if (sotinchi === 3) {
                ws.getCell('G10').value = 'BÀI 1';
                ws.getCell('G10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('G10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('G10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('H10').value = 'BÀI 2';
                ws.getCell('H10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('H10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('H10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('I10').value = 'BÀI 3';
                ws.getCell('I10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('I10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('I10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('J9:J10');
                ws.getCell('J9:J10').value = 'CC';
                ws.getCell('J9:J10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('J9:J10').font = { bold: true, size: 10, name: 'Times New Roman', };
                ws.getCell('J9:J10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('K9:K10');
                ws.getCell('K9:K10').value = 'Ghi chú';
                ws.getCell('K9:K10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('K9:K10').font = { bold: true, size: 10, name: 'Times New Roman', };
                ws.getCell('K9:K10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

            }
            if (sotinchi === 4) {
                ws.getCell('G10').value = 'BÀI 1';
                ws.getCell('G10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('G10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('G10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('H10').value = 'BÀI 2';
                ws.getCell('H10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('H10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('H10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('I10').value = 'BÀI 3';
                ws.getCell('I10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('I10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('I10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('J10').value = 'BÀI 4';
                ws.getCell('J10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('J10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('J10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('K9:K10');
                ws.getCell('K9:K10').value = 'CC';
                ws.getCell('K9:K10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('K9:K10').font = { bold: true, size: 10, name: 'Times New Roman', };
                ws.getCell('K9:K10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('L9:L10');
                ws.getCell('L9:L10').value = 'Ghi chú';
                ws.getCell('L9:L10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('L9:L10').font = { bold: true, size: 10, name: 'Times New Roman', };
                ws.getCell('L9:L10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

            }

            // ws.getColumn('A').alignment={ horizontal:"center"};
            ws.getColumn('B').width = 15;
            // ws.getColumn('B').font ={name: 'Times New Roman',};
            ws.getColumn('C').width = 22;
            ws.getColumn('D').width = 12;

            data1.forEach((d, index) => {
                const row = ws.addRow(d);
                row.font = { bold: false, size: 10, name: 'Times New Roman', };
                row.height = 20;
                row.eachCell((cell, number) => {
                    if (number === 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (number === 3) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    }

                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };

                });
            }
            );

            const curentRow = 10 + data1.length + 1;
            ws.addRow('');
            ws.mergeCells('A' + curentRow + ':J' + curentRow);
            ws.getCell('A' + curentRow + ':J' + curentRow).value = 'Danh sách có: ' + data1.length + ' Sinh viên';
            ws.getCell('A' + curentRow + ':J' + curentRow).font = { bold: false, size: 12, name: 'Times New Roman', };
            ws.getCell('A' + curentRow + ':J' + curentRow).alignment = { vertical: "middle" };

            ws.addRow('');

            ws.mergeCells('E' + (curentRow + 1) + ':K' + (curentRow + 1));
            ws.getCell('E' + (curentRow + 1) + ':K' + (curentRow + 1)).value = ' Thái Nguyên,   ngày    tháng    năm    ';
            ws.getCell('E' + (curentRow + 1) + ':K' + (curentRow + 1)).font = {
                italic: true,
                size: 12,
                name: 'Times New Roman',
            };
            ws.getCell('E' + (curentRow + 1) + ':K' + (curentRow + 1)).alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            ws.addRow('');
            ws.mergeCells('A' + (curentRow + 2) + ':C' + (curentRow + 2));
            ws.getCell('A' + (curentRow + 2) + ':C' + (curentRow + 2)).value = 'HỌ TÊN, CHỮ KÝ CỦA GIÁO VIÊN'
            ws.getCell('A' + (curentRow + 2) + ':C' + (curentRow + 2)).font = {
                bold: true,
                size: 12,
                name: 'Times New Roman',
            };
            ws.getCell('A' + (curentRow + 2) + ':C' + (curentRow + 2)).alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            ws.mergeCells('E' + (curentRow + 2) + ':K' + (curentRow + 2));
            ws.getCell('E' + (curentRow + 2) + ':K' + (curentRow + 2)).value = 'XÁC NHẬN CỦA KHOA/BỘ MÔN'
            ws.getCell('E' + (curentRow + 2) + ':K' + (curentRow + 2)).font = {
                bold: true,
                size: 12,
                name: 'Times New Roman',
            };
            ws.getCell('E' + (curentRow + 2) + ':K' + (curentRow + 2)).alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            ws.addRow('');
            ws.addRow('');
            ws.addRow('');
            ws.addRow('');
            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 7) + ':J' + (curentRow + 7));
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).value = 'Ghi chú:'
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).alignment = { horizontal: 'left' };
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).font = {
                italic: true,
                size: 10,
                name: 'Times New Roman',
            };


            ws.getCell('B' + (curentRow + 7 + 1)).value = '1. CC là cột điểm thường xuyên, quy đổi từ: ' + config_diem['cc'] + '% điểm chuyên cần + ' + config_diem['bttn'] + '% điểm TB các bài kiểm tra tại nhà + ' + txRatio + '% TB các kiểm tra giữa kỳ.';
            ws.getCell('B' + (curentRow + 7 + 1)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 2)).value = '2. Cột CC ghi: Đối với SV bị cấm thi thì ghi CAM.';
            ws.getCell('B' + (curentRow + 7 + 2)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 3)).value = '3. GV ghi rõ lý do cấm thi vào cột ghi chú.';
            ws.getCell('B' + (curentRow + 7 + 3)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 4)).value = '4. Bảng điểm ghi phải rõ ràng, có đủ chữ ký xác nhận và nộp lưu tại đơn vị Khoa/Viện.';
            ws.getCell('B' + (curentRow + 7 + 4)).font = { size: 10, name: "Times new Roman" };
        }


        if (data2 && sotinchi) {
            const ws = wb.addWorksheet('Chitiet');
            // ws.eachRow((row) => {row.eachCell((cell) => {cell.font = { name: 'Times New Roman' };});});
            // ws.addRow('')
            ws.mergeCells('A1:C1');
            ws.getCell('A1', 'C1').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A1', 'C1').value = 'ĐẠI HỌC THÁI NGUYÊN';
            ws.getCell('A1', 'C1').font = { name: 'Times New Roman', size: 10 };

            if (sotinchi === 2) {

                ws.mergeCells('E1:J1');
                ws.getCell('E1:J1').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E1:J1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
                ws.getCell('E1:J1').font = { name: 'Times New Roman', bold: true, size: 10 }
            }
            if (sotinchi === 3) {
                ws.mergeCells('E1:K1');
                ws.getCell('E1:K1').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E1:K1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
                ws.getCell('E1:K1').font = { name: 'Times New Roman', bold: true, size: 10 };
            }


            // ws.addRow('');
            ws.mergeCells('A2:C2');
            ws.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center', };
            ws.getCell('A2').value = 'TRƯỜNG ĐH CNTT VÀ TRUYỀN THÔNG';
            ws.getCell('A2').font = { underline: true, bold: true, name: 'Times New Roman', size: 10 };
            if (sotinchi === 2) {
                ws.mergeCells('E2:J2');
                ws.getCell('E2:J2').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E2:J2').value = 'Độc lập - Tự do - Hạnh phúc';
                ws.getCell('E2:J2').font = { underline: true, bold: true, size: 10, name: 'Times New Roman' };
            }
            if (sotinchi === 3) {
                ws.mergeCells('E2:K2');
                ws.getCell('E2:K2').alignment = { vertical: 'middle', horizontal: 'center' };
                ws.getCell('E2:K2').value = 'Độc lập - Tự do - Hạnh phúc';
                ws.getCell('E2:K2').font = { underline: true, bold: true, size: 10, name: 'Times New Roman' };
            }


            // ws.addRow('');
            ws.mergeCells('A3:K3');
            ws.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A3').value = 'BẢNG GHI ĐIỂM THƯỜNG XUYÊN';
            ws.getCell('A3').font = { underline: false, bold: true, size: 13, name: 'Times New Roman' };

            // ws.addRow('');
            ws.mergeCells('B4:D4');
            ws.getCell('B4:D4').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('B4:D4').value = 'Lớp học phần: ' + clases['name'];
            ws.getCell('B4:D4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.mergeCells('E4:G4');
            ws.getCell('E4:G4').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('E4:G4').value = 'Học kỳ: ' + clases['hocky'];
            ws.getCell('E4:G4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.mergeCells('H4:K4');
            ws.getCell('H4:K4').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('H4:K4').value = 'Năm học: ' + clases['namhoc'];
            ws.getCell('H4:K4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };

            // ws.addRow(' ');
            ws.mergeCells('B5:J5');
            ws.getCell('B5:J5').value = "Học Phần: " + clases['show_mon'];
            ws.getCell('B5:J5').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.getCell('B5:J5').alignment = { vertical: 'middle', horizontal: "left" };

            // ws.addRow('');
            // ws.mergeCells('A6:K6');
            let cell = ws.getCell('A6');
            cell.value = 'Giáo viên dùng danh sách này để:';
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { bold: true, size: 12, name: 'Times New Roman' };


            // ws.addRow('');
            ws.mergeCells('A7:K7');
            ws.getCell('A7').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('A7').value = '       1. Ghi điểm các bài kiểm tra thường xuyên, điểm đánh giá ý thức học tập cho sinh viên';
            ws.getCell('A7').font = { bold: false, size: 12, name: 'Times New Roman' };

            // ws.addRow('');
            ws.mergeCells('A8:K8');
            ws.getCell('A8').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('A8').value = '       2. Nộp lại cho Khoa/Bộ môn sau khi kết thúc giảng dạy học phần.';
            ws.getCell('A8').font = { bold: false, size: 12, name: 'Times New Roman' };
            // ws.getRow(8).height= 100;

            // ws.addRow('');
            // ws.addRow('');

            const header_1 = [
                'STT',
                'Mã Sinh viên',
                'Họ và Tên',
                'Ngày sinh',
                'C.CẦn',
                'Điểm bài luyện tập tại nhà',
                ...Array(weekUse).fill(''),
                'Điểm giữa kỳ',
                ...Array(tongKtKyNang - 1).fill(''),
                'CC',
                'Số buổi nghỉ',
                'Ghi chú',
                'Mô tả'
            ]

            let header_2 = Array(5).fill('');

            header_2.push('TBC');

            for (let i = 1; i <= weekUse; i++) {
                header_2.push('Bài '.concat(i.toString()));
            }

            for (let i = 1; i <= tongKtKyNang; i++) {
                header_2.push('Điểm '.concat(i.toString()));
            }

            header_2 = header_2.concat(Array(3).fill(''))

            const header1Row = ws.addRow(header_1);

            header1Row.eachCell((cell, number) => {
                cell.alignment = { vertical: "middle", horizontal: 'center' };
                cell.font = { bold: true, size: 11, name: 'Times New Roman', };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            })

            const header2Row = ws.addRow(header_2);

            header2Row.eachCell((cell, number) => {
                cell.alignment = { vertical: "middle", horizontal: 'center' };
                cell.font = { bold: true, size: 11, name: 'Times New Roman', };
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
            })

            let i = 0;

            header_1.forEach((d, index) => {
                if (i === index) {
                    if (i < 5) {
                        ws.mergeCells(this.KEY_ANSWER_new[i].concat('9:', this.KEY_ANSWER_new[i], '10'));
                        i = i + 1;
                    } else if (i >= 5 && i <= (5 + weekUse)) {
                        console.log("run");
                        ws.mergeCells(this.KEY_ANSWER_new[i].concat('9:', this.KEY_ANSWER_new[i + weekUse], '9'));
                        i = i + weekUse + 1;
                    } else if (i > 5 + weekUse && i <= (5 + weekUse + tongKtKyNang)) {
                        ws.mergeCells(this.KEY_ANSWER_new[i].concat('9:', this.KEY_ANSWER_new[i + tongKtKyNang - 1], '9'));
                        i = i + tongKtKyNang;
                    } else if (i >= (5 + weekUse + tongKtKyNang)) {
                        ws.mergeCells(this.KEY_ANSWER_new[i].concat('9:', this.KEY_ANSWER_new[i], '10'));
                        i = i + 1;
                    }
                }
            })


            ws.getColumn('B').width = 15;
            // ws.getColumn('B').font ={name: 'Times New Roman',};
            ws.getColumn('C').width = 22;
            ws.getColumn('D').width = 12;

            data2.forEach((d, index) => {
                const row = ws.addRow(d);
                row.font = { bold: false, size: 10, name: 'Times New Roman', };
                row.height = 20;
                row.eachCell((cell, number) => {
                    if (number === 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (number === 3) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    }

                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };

                    if (typeof cell.value === 'string' && cell.value.includes('- | -')) {
                        // Đặt màu chữ là màu đỏ
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D' } };
                        cell.font = { color: { argb: 'ffffff' } }; // Màu đỏ
                    }


                    const indexByArr = [];
                    if (indexByArr.includes(number)) {
                        const parts = cell.value.toString().split("|");
                        let value = parts.length > 1 ? parts[1].trim() : null;
                        if (value !== null) {
                            const numericValue = Number(value);
                            const isNumber = !isNaN(numericValue);

                            if (isNumber && value !== '-') {
                                if (numericValue < 8) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D' } };
                                    cell.font = { color: { argb: 'ffffff' } }; // Màu đỏ
                                }
                            } else {
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D' } };
                                cell.font = { color: { argb: 'ffffff' } }; // Màu đỏ
                            }
                        }
                    }

                });
            }
            );

            const curentRow = 10 + data1.length + 1;
            ws.addRow('');
            ws.mergeCells('A' + curentRow + ':J' + curentRow);
            ws.getCell('A' + curentRow + ':J' + curentRow).value = 'Danh sách có: ' + data1.length + ' Sinh viên';
            ws.getCell('A' + curentRow + ':J' + curentRow).font = { bold: false, size: 12, name: 'Times New Roman', };
            ws.getCell('A' + curentRow + ':J' + curentRow).alignment = { vertical: "middle" };

            ws.addRow('');

            ws.mergeCells('E' + (curentRow + 1) + ':K' + (curentRow + 1));
            ws.getCell('E' + (curentRow + 1) + ':K' + (curentRow + 1)).value = ' Thái Nguyên,   ngày    tháng    năm    ';
            ws.getCell('E' + (curentRow + 1) + ':K' + (curentRow + 1)).font = {
                italic: true,
                size: 12,
                name: 'Times New Roman',
            };
            ws.getCell('E' + (curentRow + 1) + ':K' + (curentRow + 1)).alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            ws.addRow('');
            ws.mergeCells('A' + (curentRow + 2) + ':C' + (curentRow + 2));
            ws.getCell('A' + (curentRow + 2) + ':C' + (curentRow + 2)).value = 'HỌ TÊN, CHỮ KÝ CỦA GIÁO VIÊN'
            ws.getCell('A' + (curentRow + 2) + ':C' + (curentRow + 2)).font = {
                bold: true,
                size: 12,
                name: 'Times New Roman',
            };
            ws.getCell('A' + (curentRow + 2) + ':C' + (curentRow + 2)).alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            ws.mergeCells('E' + (curentRow + 2) + ':K' + (curentRow + 2));
            ws.getCell('E' + (curentRow + 2) + ':K' + (curentRow + 2)).value = 'XÁC NHẬN CỦA KHOA/BỘ MÔN'
            ws.getCell('E' + (curentRow + 2) + ':K' + (curentRow + 2)).font = {
                bold: true,
                size: 12,
                name: 'Times New Roman',
            };
            ws.getCell('E' + (curentRow + 2) + ':K' + (curentRow + 2)).alignment = {
                vertical: "middle",
                horizontal: "center"
            };

            ws.addRow('');
            ws.addRow('');
            ws.addRow('');
            ws.addRow('');
            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 7) + ':J' + (curentRow + 7));
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).value = 'Ghi chú:'
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).alignment = { horizontal: 'left' };
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).font = {
                italic: true,
                size: 10,
                name: 'Times New Roman',
            };


            ws.getCell('B' + (curentRow + 7 + 1)).value = '1. CC là cột điểm thường xuyên, quy đổi từ: ' + config_diem['cc'] + '% điểm chuyên cần + ' + config_diem['bttn'] + '% điểm TB các bài kiểm tra tại nhà + ' + txRatio + '% TB các kiểm tra giữa kỳ.';
            ws.getCell('B' + (curentRow + 7 + 1)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 2)).value = '2. Cột CC ghi: Đối với SV bị cấm thi thì ghi CAM.';
            ws.getCell('B' + (curentRow + 7 + 2)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 3)).value = '3. GV ghi rõ lý do cấm thi vào cột ghi chú.';
            ws.getCell('B' + (curentRow + 7 + 3)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 4)).value = '4. Bảng điểm ghi phải rõ ràng, có đủ chữ ký xác nhận và nộp lưu tại đơn vị Khoa/Viện.';
            ws.getCell('B' + (curentRow + 7 + 4)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 5)).value = '5. Ký hiệu điểm các bài dạng A|B ( trong đó A là điểm kiểm tra 15 phút trên lớp, B là điểm cao nhất các lần luyện tập tại nhà )';
            ws.getCell('B' + (curentRow + 7 + 5)).font = { size: 10, name: "Times new Roman" };
        }

        return wb.xlsx.writeBuffer().then(data => {
            this.saveExcelFile(data, fileName);
        });
    }

    exportDataByWord(cl: Classes, coursePlanActivity: CoursePlanActivities[], fileName?: string) {
        console.log(coursePlanActivity)

        let arrayContent = [];

        if (coursePlanActivity[0] && coursePlanActivity[0].desc) {
            const arr = this.replaceContentCenter(coursePlanActivity[0].desc);
            arr.forEach((e, index) => {
                const a = new TextRun({
                    text: e,
                    size: 26,
                    break: index === 0 ? 0 : 1
                });

                arrayContent.push(a)
            })
        } else {

            for (let i = 1; i <= parseInt(cl.sotinchi) * 3; i++) {
                const text = i + ': (chưa có tên chủ đề)';
                const a = new TextRun({
                    text: text,
                    size: 26,
                    break: i === 1 ? 0 : 1
                });
                arrayContent.push(a)
            }
        }

        const arrTaiLieu = [];

        const taiLieu = coursePlanActivity['0'].children.find(f => f.title === "Tài liệu tham khảo" && f.week === 0)
        if (taiLieu && taiLieu.desc) {
            const arr = this.replaceContentCenter(taiLieu.desc);
            console.log(arr);

            arr.forEach((f, index) => {
                const a = new TextRun({
                    text: f,
                    size: 26,
                    break: index === 0 ? 0 : 1
                });
                arrTaiLieu.push(a)
            })
        } else {
            const a = new TextRun({
                text: ' ',
                size: 26,
                break: 0
            });
            arrTaiLieu.push(a)

        }
        ;

        let top_donvi = "";
        let bot_donvi = "";
        if (key_server === "ictu") {
            top_donvi = "TRƯỜNG ĐẠI HỌC CÔNG NGHỆ";
            bot_donvi = "THÔNG TIN VÀ TRUYỀN THÔNG"
        } else {
            top_donvi = APP_CONFIGS.donvitructhuoc;
        }

        //table Phần 1 :
        const table_part_1 = new Table({
            width: { size: 100, type: WidthType.AUTO },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Số tín chỉ', bold: true, size: 26 })
                                    ],
                                })
                            ]
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: cl.sotinchi.toString(), size: 26 })
                                    ],
                                    spacing: { after: 50, before: 50 },

                                })

                            ]
                        })
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Học phần thuộc', bold: true, size: 26 })
                                    ]
                                })
                            ]
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    spacing: { after: 50, before: 50 },
                                    children: [
                                        new TextRun({ text: '- Khối Kiến thức: ', size: 26 }),
                                        new TextRun({ text: '', size: 28 }),

                                        new TextRun({ text: '- Loại học phần : ', size: 26, break: 1, }),
                                        new TextRun({ text: '', size: 28 }),
                                    ]
                                })
                            ]
                        })
                    ]
                }),

                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({ text: 'Điều kiện học phần', bold: true, size: 26 })
                                    ]
                                })
                            ]
                        }),
                        new TableCell({
                            margins: { left: 60, marginUnitType: WidthType.DXA },
                            children: [
                                new Paragraph({
                                    spacing: { after: 50, before: 50 },

                                    children: [
                                        new TextRun({ text: '- Môn học trước: ', size: 26, }),
                                        new TextRun({ text: '', size: 28 }),

                                        new TextRun({ text: '- Môn học tiêm quyết: ', size: 26, break: 1, }),
                                        new TextRun({ text: '', size: 28 }),

                                        new TextRun({ text: '- Môn học song hành: ', size: 26, break: 1, }),
                                        new TextRun({ text: '', size: 28 }),
                                    ]
                                })
                            ]
                        })
                    ]
                }),

                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: 'Phân bổ thời gian', bold: true, size: 26 })]
                                })
                            ]
                        }),
                        new TableCell({
                            margins: { left: 60, marginUnitType: WidthType.DXA },

                            children: [

                                new Paragraph({
                                    spacing: { after: 50, before: 50 },
                                    children: [
                                        new TextRun({ text: 'Tổng số giờ: ', bold: true, size: 26 }),
                                        new TextRun({ text: '', size: 26 }),

                                        new TextRun({ text: '- Lý thuyết: ', size: 26, break: 1, }),
                                        new TextRun({ text: '   ', size: 26 }),
                                        new TextRun({ text: '(tiết)', size: 26 }),

                                        new TextRun({ text: '- Thảo luận/bài tập: ', size: 26, break: 1, }),
                                        new TextRun({ text: '   ', size: 26 }),
                                        new TextRun({ text: '(tiết)', size: 26 }),

                                        new TextRun({ text: '- Thực hành/Thí nghiệm: ', size: 26, break: 1, }),
                                        new TextRun({ text: '   ', size: 26 }),
                                        new TextRun({ text: '(tiết)', size: 26 }),

                                        new TextRun({ text: '- Kiểm tra định kỳ: ', size: 26, break: 1, }),
                                        new TextRun({ text: '   ', size: 26 }),
                                        new TextRun({ text: '(tiết)', size: 26 }),

                                        new TextRun({ text: '- Tự học: ', size: 26, break: 1, }),
                                        new TextRun({ text: '   ', size: 26 }),
                                        new TextRun({ text: '(tiết)', size: 26 }),

                                    ]
                                })
                            ]
                        }),
                    ]
                }),

                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 200 },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: 'Đơn vị phụ trách', bold: true, size: 26 })]
                                })
                            ]
                        }),
                        new TableCell({
                            margins: { left: 60, marginUnitType: WidthType.DXA },

                            children: [
                                new Paragraph({
                                    spacing: { after: 50, before: 50 },
                                    children: [
                                        new TextRun({ text: cl['_categories'].toLowerCase(), bold: false, size: 26 }),
                                    ]
                                })
                            ]
                        }),
                    ]
                }),
                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 200 },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: 'Nội dung chính của học phần', bold: true, size: 26 })]
                                })
                            ]
                        }),
                        new TableCell({
                            margins: { left: 60, marginUnitType: WidthType.DXA },
                            children: [
                                new Paragraph({
                                    spacing: { after: 50, before: 50 },
                                    // indent:{firstLine: 350},
                                    children: arrayContent
                                })
                            ]
                        }),
                    ]
                }),

                new TableRow({
                    children: [
                        new TableCell({
                            width: { size: 200 },
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: 'Tài liệu học tập', bold: true, size: 26 })]
                                })
                            ]
                        }),
                        new TableCell({
                            margins: { left: 60, marginUnitType: WidthType.DXA },
                            children: [
                                new Paragraph({
                                    spacing: { after: 50, before: 50 },
                                    // indent:{firstLine: 350},
                                    children: arrTaiLieu
                                })
                            ]
                        }),
                    ]
                }),


            ]
        })




        const doc = new File({
            features: {
                updateFields: true,
            },
            styles: {
                paragraphStyles: [
                    {
                        id: "MySpectacularStyle",
                        name: "My Spectacular Style",
                        basedOn: "Heading1",
                        next: "Heading1",
                        quickFormat: true,
                        run: {
                            italics: true,
                            color: "990000",
                        },
                    },
                ],
            },
            sections: [
                {
                    children: [
                        new Table({
                            width: { size: '100%', type: WidthType.AUTO },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: top_donvi.toUpperCase(),
                                                            size: 24,
                                                        }),
                                                        new TextRun({
                                                            text: bot_donvi.toUpperCase(),
                                                            break: 1,
                                                            size: 24,
                                                        }),
                                                        new TextRun({
                                                            text: cl['_categories'],
                                                            bold: true,
                                                            break: 1,
                                                            size: 24,
                                                        }),
                                                    ],
                                                    alignment: AlignmentType.CENTER

                                                }),
                                            ],
                                            borders: {
                                                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                                            },
                                        }),
                                        new TableCell({
                                            children: [
                                                new Paragraph({
                                                    children: [
                                                        new TextRun({
                                                            text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                                                            bold: true,
                                                            size: 24,
                                                        }),
                                                        new TextRun({
                                                            text: 'Độc lập – Tự do – Hạnh phúc',
                                                            break: 1,
                                                            bold: true,
                                                            size: 24,
                                                            underline: { type: UnderlineType.SINGLE },
                                                        }),
                                                    ],
                                                    alignment: AlignmentType.CENTER
                                                })
                                            ],
                                            borders: {
                                                top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                                bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                                left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                                                right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" }
                                            },
                                        }),
                                    ],
                                }),
                            ],
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: 'ĐỀ CƯƠNG CHI TIẾT HỌC PHẦN TRÌNH ĐỘ ĐẠI HỌC', size: 28, bold: true, })
                            ],
                            alignment: AlignmentType.CENTER,
                            spacing: { after: 300, before: 300 }
                        }),
                        new Paragraph({
                            indent: { firstLine: 350, },
                            children: [
                                new TextRun({ text: 'Tên học phần  : ', size: 28, bold: true, }),
                                new TextRun({ text: cl.name, size: 28, })
                            ],
                        }),

                        new Paragraph({
                            indent: { firstLine: 350 },
                            children: [
                                new TextRun({ text: 'Tên tiếng Anh : ', size: 28, bold: true, }),
                                new TextRun({ text: '   ', size: 28, })
                            ],
                        }),

                        new Paragraph({
                            indent: { firstLine: 350 },
                            children: [
                                new TextRun({ text: 'Mã học phần   : ', size: 28, bold: true, }),
                                new TextRun({ text: cl.kyhieu, size: 28, })
                            ],
                        }),

                        new Paragraph({
                            // indent: {
                            //     firstLine: 350,
                            // },
                            children: [
                                new TextRun({ text: '1. Thông tin về học phần ', size: 28, bold: true, }),
                            ],
                            spacing: { after: 100, before: 100 },


                        }),

                        table_part_1,

                    ],
                    footers: {
                        default: new Footer({
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            children: [PageNumber.CURRENT], font: "Arial", // placeholder số trang
                                        }),
                                    ],
                                    alignment: AlignmentType.CENTER
                                }),
                            ],
                        }),
                    },
                },
            ],

        })


        // Packer.toBuffer(doc).then((buffer) => {
        //     fs.writeFileSync("My Document.docx", buffer);
        // });
        Packer.toBlob(doc).then((blob) => {
            FileSaver(blob, (fileName ? fileName : cl.name) + '.docx');
        });

    }

    replaceContentCenter(htmlContent: string): any[] {
        const regex = /<p[^>]*>(.*?)<\/p>/g;
        let match;
        const contentArray = [];

        while ((match = regex.exec(htmlContent)) !== null) {
            // Xóa các thẻ HTML con (như <span>, <o:p>) để lấy nội dung thuần túy
            const textContent = match[1].replace(/<[^>]*>/g, '').replace('&nbsp;', '').trim();
            contentArray.push(textContent.replace('Chủ đề ', '').trim());
        }

        return contentArray;
    }


    setColWidth(ws, cols: {}) {
        Object.keys(cols).forEach((f, key) => {
            ws.getColumn(Number(f)).width = cols[f];
        })
    }

    exportThuongxuyenByHvu(data1: any[], data2: any[], clases: any, fileName: string, weekUse: number, configPersent: PercentScore, numOfBan: number, listCodeStudentBan: string) {
        const sotinchi = parseInt(clases['sotinchi']);
        const numOfTx = sotinchi == 2 ? 1 : ([3, 4].includes(sotinchi) ? 2 : sotinchi);

        const wb = new exceljs.Workbook();

        if (data1 && sotinchi) {
            const ws = wb.addWorksheet('BangDiemTX');
            ws.addRow('');
            ws.mergeCells('A1:C1');
            ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A1').value = 'TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG';
            ws.getCell('A1').font = { name: 'Tahoma', bold: true, size: 8 };

            ws.mergeCells('D1:M1');
            ws.getCell('D1').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('D1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
            ws.getCell('D1').font = { name: 'Tahoma', bold: true, size: 10 }

            ws.addRow('');
            ws.mergeCells('A2:C2');
            ws.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center', };
            ws.getCell('A2').value = 'PHÒNG ĐÀO TẠO';
            ws.getCell('A2').font = { bold: true, name: 'Tahoma', size: 8 };

            ws.mergeCells('D2:M2');
            ws.getCell('D2').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('D2').value = 'Độc lập - Tự do - Hạnh phúc';
            ws.getCell('D2').font = { underline: false, bold: true, size: 8, name: 'Tahoma' };


            ws.addRow('');
            ws.mergeCells('A3:M3');
            ws.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A3').value = 'BẢNG ĐIỂM THÀNH PHẦN VÀ THEO DÕI SINH VIÊN HỌC TẬP';
            ws.getCell('A3').font = { underline: false, bold: true, size: 12, name: 'Tahoma' };
            ws.getRow(3).height = 20;

            ws.addRow('');
            ws.mergeCells('A4:M4');
            ws.getCell('A4').alignment = { vertical: "middle", horizontal: "center" };
            ws.getCell('A4').value = `Học kỳ: ${clases['hocky']} - Năm học ${clases['namhoc']}`;
            ws.getCell('A4').font = { underline: false, bold: false, size: 9, name: 'Tahoma' };
            ws.getRow(4).height = 20;


            ws.addRow(' ');

            ws.getCell('B5').value = "Môn học/Nhóm";
            ws.getCell('B5').font = { underline: false, bold: false, size: 8, name: 'Tahoma' };
            ws.getCell('B5').alignment = { vertical: 'middle', horizontal: "left" };

            ws.mergeCells('C5:K5');
            ws.getCell('C5').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('C5').value = `${clases['name']}`;
            ws.getCell('C5').font = { underline: false, bold: false, size: 8, name: 'Tahoma' };

            ws.mergeCells('L5:M5');
            ws.getCell('L5').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('L5').value = `Số tín chỉ: ${clases['sotinchi']}`;
            ws.getCell('L5').font = { underline: false, bold: false, size: 8, name: 'Tahoma' };

            ws.addRow('');
            // ws.mergeCells('A6:K6');
            let cell = ws.getCell('B6');
            cell.value = 'CBGD';
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { bold: true, size: 8, name: 'Tahoma' };

            ws.mergeCells('C6:K6');
            ws.getCell('C6').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('C6').value = `${clases['giangvien'] ? clases['giangvien'] : ''}`;
            ws.getCell('C6').font = { underline: false, bold: false, size: 8, name: 'Tahoma' };

            ws.mergeCells('L6:M6');
            ws.getCell('L6').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('L6').value = `% Kiểm Tra: 50`;
            ws.getCell('L6').font = { underline: false, bold: false, size: 8, name: 'Tahoma' };

            // ws.getRow(8).height= 100;

            // ws.addRow('');
            ws.addRow('');

            ws.addRow('');
            // ws.mergeCells('A8');
            ws.getCell('A8').value = 'STT';
            ws.getCell('A8').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('A8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('A8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            // ws.mergeCells('B8');
            ws.getCell('B8').value = 'Mã Sinh viên';
            ws.getCell('B8').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('B8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('B8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('C8:D8');
            ws.getCell('C8').value = 'Họ và Tên';
            ws.getCell('C8').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('C8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('C8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('E8');
            ws.getCell('E8').value = 'Ng/sinh';
            ws.getCell('E8').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('E8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('E8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            // ws.mergeCells('E9:G9');

            ws.getCell('F8').value = 'Tên lớp';
            ws.getCell('F8').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('F8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('F8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.getCell('G8').value = 'CC';
            ws.getCell('G8').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('G8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('G8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            ws.getCell('H8').value = 'TBC KT\n theo bài';
            ws.getCell('H8').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
            ws.getCell('H8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('H8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            ws.mergeCells('I8:K8');
            ws.getCell('I8').value = 'Điểm TX';
            ws.getCell('I8').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
            ws.getCell('I8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('I8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            ws.getCell('L8').value = 'TBC\n ĐTP(*)';
            ws.getCell('L8').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
            ws.getCell('L8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('L8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            ws.getCell('M8').value = 'Số\n tiết nghỉ';
            ws.getCell('M8').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
            ws.getCell('M8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('M8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            ws.getCell('N8').value = 'Ghi chú';
            ws.getCell('N8').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
            ws.getCell('N8').font = { bold: true, size: 8, name: 'Tahoma', };
            ws.getCell('N8').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            // ws.getColumn('A').alignment={ horizontal:"center"};
            // ws.getColumn('B').width = 15;
            // ws.getColumn('B').font ={name: 'Tahoma',};
            // ws.getColumn('C').width = 22;
            // ws.getColumn('D').width = 12;





            data1.forEach((d, index) => {
                const row = ws.addRow(d);
                row.font = { bold: false, size: 8, name: 'Tahoma', };
                row.height = 20;
                row.eachCell((cell, number) => {
                    if (number === 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if ([3, 4].includes(number)) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    }




                    if (number == 4) {
                        cell.border = {
                            top: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };
                    } else if (number == 3) {
                        cell.border = {
                            top: { style: 'thin', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                        };
                    } else {
                        cell.border = {
                            top: { style: 'thin', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
                        };
                    }



                });
            }
            );

            const curentRow = 8 + data1.length + 2;
            ws.addRow('');
            ws.mergeCells('A' + curentRow + ':F' + curentRow);

            ws.getCell('A' + curentRow + ':F').value = `Số SV đủ điều kiện dự thi kết thúc học phần: ${numOfBan}`;
            ws.getCell('A' + curentRow + ':F').font = { bold: false, size: 8, name: 'Tahoma', };
            ws.getCell('A' + curentRow + ':F').alignment = { vertical: "middle" };

            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 1) + ':E' + (curentRow + 1));
            ws.getCell('A' + (curentRow + 1)).value = `Số SV không đủ điều kiện dự thi kết thúc học phần: ${data1.length - numOfBan} `;
            ws.getCell('A' + (curentRow + 1)).font = { size: 8, name: 'Tahoma', };
            ws.getCell('A' + (curentRow + 1)).alignment = { vertical: "middle", horizontal: "left" };

            ws.mergeCells('F' + (curentRow + 1) + ':M' + (curentRow + 1));
            ws.getCell('F' + (curentRow + 1)).value = `Mã SV không đủ ĐKDTHP : ${listCodeStudentBan} `;
            ws.getCell('F' + (curentRow + 1)).font = { size: 8, name: 'Tahoma', };
            ws.getCell('F' + (curentRow + 1)).alignment = { vertical: "middle", horizontal: "left", wrapText: true, shrinkToFit: true };

            ws.getRow(curentRow + 1).height = 30;


            ws.addRow('');
            ws.addRow('');
            ws.mergeCells('H' + (curentRow + 3) + ':M' + (curentRow + 3));
            ws.getCell('H' + (curentRow + 3)).value = 'Ngày........Tháng........Năm........';
            ws.getCell('H' + (curentRow + 3)).font = { size: 8, name: 'Tahoma', };
            ws.getCell('H' + (curentRow + 3)).alignment = { vertical: "middle", horizontal: "right" };

            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 4) + ':C' + (curentRow + 4));
            ws.getCell('A' + (curentRow + 4)).value = 'CÁN BỘ GIẢNG DẠY'
            ws.getCell('A' + (curentRow + 4)).font = { bold: true, size: 9, name: 'Tahoma', };
            ws.getCell('A' + (curentRow + 4)).alignment = { vertical: "top", horizontal: "center" };
            // ws.getCell('A' + (curentRow + 4)).height = 30;

            ws.mergeCells('D' + (curentRow + 4) + ':H' + (curentRow + 4));
            ws.getCell('D' + (curentRow + 4)).value = 'TRƯỞNG BỘ MÔN'
            ws.getCell('D' + (curentRow + 4)).font = { bold: true, size: 9, name: 'Tahoma', };
            ws.getCell('D' + (curentRow + 4)).alignment = { vertical: "top", horizontal: "center" };
            // ws.getCell('D' + (curentRow + 4)).height = 30;

            ws.mergeCells('I' + (curentRow + 4) + ':M' + (curentRow + 4));
            ws.getCell('I' + (curentRow + 4)).value = 'TRƯỞNG KHOA QLND ĐÀO TẠO'
            ws.getCell('I' + (curentRow + 4)).font = { bold: true, size: 9, name: 'Tahoma', };
            ws.getCell('I' + (curentRow + 4)).alignment = { vertical: "top", horizontal: "center" };
            // ws.getCell('I' + (curentRow + 4)).height = 30;
            ws.getRow(curentRow + 4).height = 50;


            const objectColWidth = {
                1: 3.29,
                2: 11,
                3: 15,
                4: 9,
                5: 9,
                6: 10,
                7: 6,
                8: 12,
                9: 5,
                10: 5,
                11: 5,
                12: 8,
                13: 9,
                14: 7,

            };

            this.setColWidth(ws, objectColWidth);


            ws.pageSetup = {
                paperSize: 9,             // 9 ~ A4
                orientation: 'portrait', // 'portrait' hoặc 'landscape'
                fitToPage: true,
                fitToWidth: 1,            // ép vừa 1 trang ngang
                fitToHeight: 0,           // 0 = không cố gắng fit chiều dọc
                horizontalCentered: true, // căn giữa trang theo ngang khi in
                verticalCentered: false,
                margins: {
                    left: 0.2, right: 0.2, top: 0.2, bottom: 0.2,
                    header: 0.3, footer: 0.3
                }
            };

        }
        if (data2 && sotinchi) {
            const ws = wb.addWorksheet('Chitiet');
            // ws.addRow('')
            // ws.mergeCells('A1:C1');
            // ws.getCell('A1', 'C1').alignment = {vertical: 'middle', horizontal: 'center'};
            // ws.getCell('A1', 'C1').value = '';
            // ws.getCell('A1', 'C1').font = {name: 'Times New Roman', size: 10};

            ws.mergeCells('A1:C1');
            ws.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A1').value = 'TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG';
            ws.getCell('A1').font = { name: 'Times New Roman', size: 10, bold: true, };

            ws.mergeCells('D1:M1');
            ws.getCell('D1').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('D1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM';
            ws.getCell('D1').font = { name: 'Times New Roman', bold: true, size: 10 }

            ws.addRow('');
            ws.mergeCells('A2:C2');
            ws.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center', };
            ws.getCell('A2').value = 'PHÒNG ĐÀO TẠO';
            ws.getCell('A2').font = { underline: true, bold: true, name: 'Times New Roman', size: 10 };

            ws.mergeCells('D2:M2');
            ws.getCell('D2').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('D2').value = 'Độc lập - Tự do - Hạnh phúc';
            ws.getCell('D2').font = { underline: true, bold: true, size: 10, name: 'Times New Roman' };


            ws.addRow('');
            ws.mergeCells('A3:M3');
            ws.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
            ws.getCell('A3').value = 'BẢNG ĐIỂM THÀNH PHẦN VÀ THEO DÕI SINH VIÊN HỌC TẬP';
            ws.getCell('A3').font = { underline: false, bold: true, size: 13, name: 'Times New Roman' };


            ws.addRow('');
            ws.mergeCells('A4:M4');
            ws.getCell('A4').alignment = { vertical: "middle", horizontal: "center" };
            ws.getCell('A4').value = `Học kỳ: ${clases['hocky']} - Năm học ${clases['namhoc']}`;
            ws.getCell('A4').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };


            ws.addRow(' ');

            ws.getCell('B5').value = "Môn học/Nhóm" + clases['show_mon'];
            ws.getCell('B5').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            ws.getCell('B5').alignment = { vertical: 'middle', horizontal: "left" };

            ws.mergeCells('C5:I5');
            ws.getCell('C5').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('C5').value = `${clases['show_mon']}`;
            ws.getCell('C5').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };

            ws.mergeCells('L5:M5');
            ws.getCell('L5').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('L5').value = `Số tín chỉ: ${clases['sotinchi']}`;
            ws.getCell('L5').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };

            ws.addRow('');
            // ws.mergeCells('A6:K6');
            let cell = ws.getCell('B6');
            cell.value = 'CBGD';
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.font = { bold: true, size: 12, name: 'Times New Roman' };

            ws.mergeCells('C6:I6');
            ws.getCell('C6').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('C6').value = `${clases['giangvien'] ? clases['giangvien'] : ''}`;
            ws.getCell('C6').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };

            ws.mergeCells('L6:M6');
            ws.getCell('L6').alignment = { vertical: "middle", horizontal: "left" };
            ws.getCell('L6').value = `% Kiểm Tra: 50`;
            ws.getCell('L6').font = { underline: false, bold: false, size: 12, name: 'Times New Roman' };
            // ws.getRow(8).height= 100;

            ws.addRow('');
            ws.mergeCells('A9:A10');
            ws.getCell('A9:A10').value = 'STT';
            ws.getCell('A9:A10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('A9:A10').font = { bold: true, size: 12, name: 'Times New Roman', };
            ws.getCell('A9:A10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('B9:B10');
            ws.getCell('B9:B10').value = 'Mã SV';
            ws.getCell('B9:B10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('B9:B10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('B9:B10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };
            ws.mergeCells('C9:C10');
            ws.getCell('C9:C10').value = 'Họ và Tên';
            ws.getCell('C9:C10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('C9:C10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('C9:C10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('D9:D10');
            ws.getCell('D9:D10').value = 'Ngày sinh';
            ws.getCell('D9:D10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('D9:D10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('D9:D10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.mergeCells('E9:E10');
            ws.getCell('E9:E10').value = 'C.CẦn';
            ws.getCell('E9:E10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('E9:E10').font = { bold: true, size: 11, name: 'Times New Roman', };
            ws.getCell('E9:E10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            if (sotinchi === 2) {
                ws.mergeCells('F9:L9');
                ws.getCell('F9').value = 'Điểm bài Test tuần ';
                ws.getCell('F9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('F9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('F9').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }, };

                // ws.mergeCells('L9:M9');
                ws.getCell('M9').value = ' Điểm TX ';
                ws.getCell('M9').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
                ws.getCell('M9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('M9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('N9:N10');
                ws.getCell('N9').value = ' CC ';
                ws.getCell('N9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('N9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('N9').border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }, };

                ws.mergeCells('O9:O10');
                ws.getCell('O9').value = ' Số\n tiết nghỉ ';
                ws.getCell('O9').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
                ws.getCell('O9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('O9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('P9:P10');
                ws.getCell('P9').value = ' Ghi chú ';
                ws.getCell('P9').alignment = { vertical: "middle", horizontal: 'center', };
                ws.getCell('P9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('P9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };



                ws.getCell('L10');
                ws.getCell('L10').value = ' Bài 6 ';
                ws.getCell('L10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('L10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('L10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('M10');
                ws.getCell('M10').value = ' TX1 ';
                ws.getCell('M10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('M10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('M10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

            }
            if (sotinchi == 3) {
                ws.mergeCells('F9:O9');
                ws.getCell('F9').value = 'Điểm bài Test tuần ';
                ws.getCell('F9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('F9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('F9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('P9:Q9');
                ws.getCell('P9').value = ' Điểm TX ';
                ws.getCell('P9').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
                ws.getCell('P9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('P9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('R9:R10');
                ws.getCell('R9').value = ' CC ';
                ws.getCell('R9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('R9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('R9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('S9:S10');
                ws.getCell('S9').value = ' Số\n tiết nghỉ ';
                ws.getCell('S9').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
                ws.getCell('S9').font = { bold: true, size: 11, name: 'Times New Roman' };
                ws.getCell('S9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('T9:T10');
                ws.getCell('T9').value = ' Ghi chú ';
                ws.getCell('T9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('T9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('T9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('L10').value = ' Bài 6 ';
                ws.getCell('L10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('L10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('L10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('M10').value = ' Bài 7 ';
                ws.getCell('M10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('M10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('M10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('N10').value = ' Bài 8 ';
                ws.getCell('N10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('N10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('N10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('O10').value = ' Bài 9 ';
                ws.getCell('O10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('O10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('O10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('P10');
                ws.getCell('P10').value = ' TX1 ';
                ws.getCell('P10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('P10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('P10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('Q10');
                ws.getCell('Q10').value = ' TX2 ';
                ws.getCell('Q10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('Q10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('Q10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

            }
            if (sotinchi == 4) {
                ws.mergeCells('F9:R9');
                ws.getCell('F9').value = 'Điểm bài Test tuần ';
                ws.getCell('F9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('F9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('F9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('S9:T9');
                ws.getCell('S9').value = ' Điểm TX';
                ws.getCell('S9').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
                ws.getCell('S9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('S9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('U9:U10');
                ws.getCell('U9').value = ' CC ';
                ws.getCell('U9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('U9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('U9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.mergeCells('V9:V10');
                ws.getCell('V9').value = ' Số\n tiết nghỉ ';
                ws.getCell('V9').alignment = { vertical: "middle", horizontal: 'center', wrapText: true };
                ws.getCell('V9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('V9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.mergeCells('W9:W10');
                ws.getCell('W9').value = ' Ghi chú ';
                ws.getCell('W9').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('W9').font = { bold: true, size: 11, name: 'Times New Roman', };
                ws.getCell('W9').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('L10').value = ' Bài 6 ';
                ws.getCell('L10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('L10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('L10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('M10').value = ' Bài 7 ';
                ws.getCell('M10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('M10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('M10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('N10').value = ' Bài 8 ';
                ws.getCell('N10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('N10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('N10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('O10');
                ws.getCell('O10').value = ' Bài 9 ';
                ws.getCell('O10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('O10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('O10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('P10');
                ws.getCell('P10').value = ' Bài 10 ';
                ws.getCell('P10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('P10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('P10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('Q10');
                ws.getCell('Q10').value = ' Bài 11 ';
                ws.getCell('Q10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('Q10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('Q10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('R10');
                ws.getCell('R10').value = ' Bài 12 ';
                ws.getCell('R10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('R10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('R10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };

                ws.getCell('S10');
                ws.getCell('S10').value = ' TX1 ';
                ws.getCell('S10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('S10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('S10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                ws.getCell('T10');
                ws.getCell('T10').value = ' TX2 ';
                ws.getCell('T10').alignment = { vertical: "middle", horizontal: 'center' };
                ws.getCell('T10').font = { bold: false, size: 10, name: 'Times New Roman', };
                ws.getCell('T10').border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };


            }


            ws.getCell('F10');
            ws.getCell('F10').value = 'TBC';
            ws.getCell('F10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('F10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('F10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.getCell('G10');
            ws.getCell('G10').value = ' Bài 1 ';
            ws.getCell('G10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('G10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('G10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            ws.getCell('H10').value = ' Bài 2 ';
            ws.getCell('H10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('H10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('H10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            ws.getCell('I10').value = ' Bài 3 ';
            ws.getCell('I10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('I10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('I10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            ws.getCell('J10').value = ' Bài 4 ';
            ws.getCell('J10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('J10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('J10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };


            ws.getCell('K10').value = ' Bài 5 ';
            ws.getCell('K10').alignment = { vertical: "middle", horizontal: 'center' };
            ws.getCell('K10').font = { bold: false, size: 10, name: 'Times New Roman', };
            ws.getCell('K10').border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
            };

            ws.getColumn('B').width = 15;
            // ws.getColumn('B').font ={name: 'Times New Roman',};
            ws.getColumn('C').width = 22;
            ws.getColumn('D').width = 12;

            data2.forEach((d, index) => {
                const row = ws.addRow(d);
                row.font = { bold: false, size: 10, name: 'Times New Roman', };
                row.height = 20;
                row.eachCell((cell, number) => {
                    if (number === 1) {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    } else if (number === 3) {
                        cell.alignment = { vertical: 'middle', horizontal: 'left' };
                    } else {
                        cell.alignment = { vertical: 'middle', horizontal: 'center' };
                    }

                    cell.border = {
                        top: { style: 'thin', color: { argb: '333333' } },
                        left: { style: 'thin', color: { argb: '333333' } },
                        bottom: { style: 'thin', color: { argb: '333333' } },
                        right: { style: 'thin', color: { argb: '333333' } }
                    };

                    if (typeof cell.value === 'string' && cell.value.includes('- | -')) {
                        // Đặt màu chữ là màu đỏ
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D' } };
                        cell.font = { color: { argb: 'ffffff' } }; // Màu đỏ
                    }


                    const indexByArr = weekUse == 5 ? [7, 8, 9, 10, 11] : (weekUse == 8 ? [7, 8, 9, 10, 11, 12, 13, 14] : (weekUse == 11 ? [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17] : []));
                    if (indexByArr.includes(number)) {


                        const parts = cell.value.toString().split("|");
                        let value = parts.length > 1 ? parts[1].trim() : null;
                        if (value !== null) {
                            const numericValue = Number(value);
                            const isNumber = !isNaN(numericValue);

                            if (isNumber && value !== '-') {
                                if (numericValue < 8) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D' } };
                                    cell.font = { color: { argb: 'ffffff' } }; // Màu đỏ
                                }
                            } else {
                                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2D2D' } };
                                cell.font = { color: { argb: 'ffffff' } }; // Màu đỏ
                            }
                        }
                    }

                });
            }
            );

            const curentRow = 10 + data1.length + 2;
            ws.addRow('');

            ws.getCell('A' + curentRow + ':F').value = `Số SV đủ điều kiện dự thi kết thúc học phần: ${numOfBan}`;
            ws.getCell('A' + curentRow + ':F').font = { bold: false, size: 12, name: 'Times New Roman', };
            ws.getCell('A' + curentRow + ':F').alignment = { vertical: "middle" };

            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 1) + ':F' + (curentRow + 2));
            ws.getCell('A' + (curentRow + 1)).value = `Số SV không đủ điều kiện dự thi kết thúc học phần: ${data1.length - numOfBan} `;
            ws.getCell('A' + (curentRow + 1)).font = { size: 12, name: 'Times New Roman', };
            ws.getCell('A' + (curentRow + 1)).alignment = { vertical: "middle", horizontal: "left" };
            ws.mergeCells('G' + (curentRow + 1) + ':M' + (curentRow + 1));
            ws.getCell('G' + (curentRow + 1)).value = `Mã SV không đủ ĐKDTHP : ${listCodeStudentBan} `;
            ws.getCell('G' + (curentRow + 1)).font = { size: 12, name: 'Times New Roman', };
            ws.getCell('G' + (curentRow + 1)).alignment = { vertical: "middle", horizontal: "left" };

            ws.addRow('');
            ws.addRow('');
            ws.mergeCells('H' + (curentRow + 3) + ':M' + (curentRow + 3));
            ws.getCell('H' + (curentRow + 3)).value = 'Ngày........Tháng........Năm........';
            ws.getCell('H' + (curentRow + 3)).font = { size: 12, name: 'Times New Roman', };
            ws.getCell('H' + (curentRow + 3)).alignment = { vertical: "middle", horizontal: "right" };

            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 4) + ':C' + (curentRow + 4));
            ws.getCell('A' + (curentRow + 4)).value = 'CÁN BỘ GIẢNG DẠY'
            ws.getCell('A' + (curentRow + 4)).font = { bold: true, size: 12, name: 'Times New Roman', };
            ws.getCell('A' + (curentRow + 4)).alignment = { vertical: "top", horizontal: "center" };
            // ws.getCell('A' + (curentRow + 4)).height = 30;

            ws.mergeCells('D' + (curentRow + 4) + ':H' + (curentRow + 4));
            ws.getCell('D' + (curentRow + 4)).value = 'TRƯỞNG BỘ MÔN'
            ws.getCell('D' + (curentRow + 4)).font = { bold: true, size: 12, name: 'Times New Roman', };
            ws.getCell('D' + (curentRow + 4)).alignment = { vertical: "top", horizontal: "center" };
            // ws.getCell('D' + (curentRow + 4)).height = 30;

            ws.mergeCells('I' + (curentRow + 4) + ':M' + (curentRow + 4));
            ws.getCell('I' + (curentRow + 4)).value = 'TRƯỞNG KHOA QLND ĐÀO TẠO'
            ws.getCell('I' + (curentRow + 4)).font = { bold: true, size: 12, name: 'Times New Roman', };
            ws.getCell('I' + (curentRow + 4)).alignment = { vertical: "top", horizontal: "center" };
            // ws.getCell('I' + (curentRow + 4)).height = 30;
            ws.getRow(curentRow + 4).height = 50;

            ws.addRow('');
            ws.addRow('');
            ws.addRow('');
            ws.addRow('');
            ws.addRow('');

            ws.mergeCells('A' + (curentRow + 7) + ':J' + (curentRow + 7));
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).value = 'Ghi chú:'
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).alignment = { horizontal: 'left' };
            ws.getCell('A' + (curentRow + 7) + ':J' + (curentRow + 7)).font = {
                italic: true,
                size: 10,
                name: 'Times New Roman',
            };


            ws.getCell('B' + (curentRow + 7 + 1)).value = `1. CC là cột điểm thường xuyên bao gồm: ${configPersent.cc}% điểm chuyên cần + ${configPersent.daugio}% điểm TB các bài test đầu tiên + ${configPersent.kynang}% TB các kiểm tra.`;
            ws.getCell('B' + (curentRow + 7 + 1)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 2)).value = '2. Cột CC ghi: Đối với SV bị cấm thi thì ghi CAM.';
            ws.getCell('B' + (curentRow + 7 + 2)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 3)).value = '3. GV ghi rõ lý do cấm thi vào cột ghi chú.';
            ws.getCell('B' + (curentRow + 7 + 3)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 4)).value = '4. Bảng điểm ghi phải rõ ràng, có đủ chữ ký xác nhận và nộp lưu tại đơn vị Khoa/Viện.';
            ws.getCell('B' + (curentRow + 7 + 4)).font = { size: 10, name: "Times new Roman" };

            ws.getCell('B' + (curentRow + 7 + 5)).value = '5. Ký hiệu điểm các bài dạng A|B ( trong đó A là điểm bài test đầu tiên mỗi tuần, B là điểm cao nhất các lần test tuần )';
            ws.getCell('B' + (curentRow + 7 + 5)).font = { size: 10, name: "Times new Roman" };

        }

        wb.xlsx.writeBuffer().then((data) => {
            this.saveExcelFile(data, fileName);
        });

    }

    exportThuongxuyenByHvuMau2(data1: any[], data2: any[], clases: any, fileName: string, weekUse: number, configPersent: PercentScore, numOfBan: number, listCodeStudentBan: string) {

    }
}
