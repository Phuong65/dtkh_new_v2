import { Injectable } from '@angular/core';
import * as FileSaver from 'file-saver';
import * as exceljs from 'exceljs';
import { RptClassStudentPoints } from './rpt-class-student-points.service';
import { Classes } from '../models/classes';
import { CellValue } from 'exceljs';

@Injectable({
    providedIn: 'root'
})

export class ExportDiemthuongxuyenV2Service {
    fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    fileExtension = '.xlsx';

    constructor() {

    }

    private saveExcelFile(buffer: any, fileName: string): void {
        const data: Blob = new Blob([buffer], { type: this.fileType });
        FileSaver.saveAs(data, fileName + this.fileExtension);
    }

    exportExcel(object_data: { [key: string]: RptClassStudentPoints[] }, _class: Classes) {

        const wb = new exceljs.Workbook();

        wb.calcProperties.fullCalcOnLoad = true;

        const ws = wb.addWorksheet("Bảng Điểm", { pageSetup: { paperSize: 9, orientation: 'portrait' } });

        ws.pageSetup.margins = {
            left: 0.38, right: 0.194,
            top: 0.194, bottom: 0.194,
            header: 0, footer: 0
        };

        let index_row = 0;

        ws.getColumn(1).width = 3.95;
        ws.getColumn(2).width = 11.32;
        ws.getColumn(3).width = 16.89;
        ws.getColumn(4).width = 8;
        ws.getColumn(5).width = 9.28;
        ws.getColumn(6).width = 8.6;
        ws.getColumn(7).width = 4.28;
        ws.getColumn(8).width = 6.6;
        ws.getColumn(9).width = 3.6;
        ws.getColumn(10).width = 3.6;
        ws.getColumn(11).width = 3.6;
        ws.getColumn(12).width = 6.8;
        ws.getColumn(13).width = 6;
        ws.getColumn(14).width = 5;

        Object.keys(object_data).forEach(o => {
            const data_: RptClassStudentPoints[] = object_data[o];

            //start row
            ws.addRow(['TRƯỜNG ĐẠI HỌC HÙNG VƯƠNG', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17.75;

            ws.mergeCells(this.getCells("A", index_row, "C", index_row).mergeCells);
            ws.getCell(this.getCells("A", index_row, "C", index_row).start_cell, this.getCells("A", index_row, "C", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("A", index_row, "C", index_row).start_cell, this.getCells("A", index_row, "C", index_row).end_cell).font = { size: 8, name: 'Tahoma', bold: true }

            ws.mergeCells(this.getCells("D", index_row, "N", index_row).mergeCells);
            ws.getCell(this.getCells("D", index_row, "N", index_row).start_cell, this.getCells("D", index_row, "N", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("D", index_row, "N", index_row).start_cell, this.getCells("D", index_row, "N", index_row).end_cell).font = { size: 10, name: 'Tahoma', bold: true };
            //end row

            //start row
            ws.addRow(['PHÒNG ĐÀO TẠO', '', '', 'Độc lập - Tự do - Hạnh phúc']);
            index_row = index_row + 1;
            ws.getRow(index_row).height = 14;

            ws.mergeCells(this.getCells("A", index_row, "C", index_row).mergeCells);
            ws.getCell(this.getCells("A", index_row, "C", index_row).start_cell, this.getCells("A", index_row, "C", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("A", index_row, "C", index_row).start_cell, this.getCells("A", index_row, "C", index_row).end_cell).font = { size: 8, name: 'Tahoma', bold: true };

            ws.mergeCells(this.getCells("D", index_row, "N", index_row).mergeCells);
            ws.getCell(this.getCells("D", index_row, "N", index_row).start_cell, this.getCells("D", index_row, "N", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("D", index_row, "N", index_row).start_cell, this.getCells("D", index_row, "N", index_row).end_cell).font = { size: 8, name: 'Tahoma', bold: true };
            //end row

            //start row
            ws.addRow(['BẢNG ĐIỂM THÀNH PHẦN VÀ THEO DÕI SINH VIÊN HỌC TẬP']);
            index_row = index_row + 1;
            ws.getRow(index_row).height = 26.75;

            ws.mergeCells(this.getCells("A", index_row, "N", index_row).mergeCells);
            ws.getCell(this.getCells("A", index_row, "N", index_row).start_cell, this.getCells("A", index_row, "N", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("A", index_row, "N", index_row).start_cell, this.getCells("A", index_row, "N", index_row).end_cell).font = { size: 12, name: 'Tahoma', bold: true };
            //end row

            //start row
            const text_hocky_namhoc = 'Học Kỳ'.concat(' ', _class.hocky.toString(), ' - ', 'Năm Học '.concat(_class.namhoc.replace("_", "-")))
            ws.addRow([text_hocky_namhoc]);
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17;

            ws.mergeCells(this.getCells("A", index_row, "N", index_row).mergeCells);
            ws.getCell(this.getCells("A", index_row, "N", index_row).start_cell, this.getCells("A", index_row, "N", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("A", index_row, "N", index_row).start_cell, this.getCells("A", index_row, "N", index_row).end_cell).font = { size: 9, name: 'Tahoma' };
            //end row

            //start row
            const nhom = _class.kyhieu ? _class.kyhieu.split("-").filter(m => m && m !== "") : [];
            nhom.splice(0, 1);
            ws.addRow(['', 'Môn học/Nhóm', _class.course_detail.title.concat(" (", nhom.toString().replace(/\,/, " - "), ")")].concat(Array(8).fill("")).concat(["Số tín chỉ: ".concat(_class.course_detail.params.sotinchi.toString())]));
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17.75;

            ws.getCell('B'.concat(index_row.toString())).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell('B'.concat(index_row.toString())).font = { size: 8, name: 'Tahoma' };

            ws.mergeCells(this.getCells("C", index_row, "I", index_row).mergeCells);
            ws.getCell(this.getCells("C", index_row, "I", index_row).start_cell, this.getCells("C", index_row, "I", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell(this.getCells("C", index_row, "I", index_row).start_cell, this.getCells("C", index_row, "I", index_row).end_cell).font = { size: 8, name: 'Tahoma', bold: true };

            ws.mergeCells(this.getCells("L", index_row, "M", index_row).mergeCells);
            ws.getCell(this.getCells("L", index_row, "M", index_row).start_cell, this.getCells("L", index_row, "M", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell(this.getCells("L", index_row, "M", index_row).start_cell, this.getCells("L", index_row, "M", index_row).end_cell).font = { size: 8, name: 'Tahoma' };
            //end row

            //start row 
            ws.addRow(['', 'CBGD', _class['giangvien'].concat(" (", _class['magiangvien'], ")")].concat(Array(8).fill("")).concat(["% Kiểm Tra:"]));
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17.75;

            ws.getCell('B'.concat(index_row.toString())).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell('B'.concat(index_row.toString())).font = { size: 8, name: 'Tahoma' };

            ws.mergeCells(this.getCells("C", index_row, "I", index_row).mergeCells);
            ws.getCell(this.getCells("C", index_row, "I", index_row).start_cell, this.getCells("C", index_row, "I", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell(this.getCells("C", index_row, "I", index_row).start_cell, this.getCells("C", index_row, "I", index_row).end_cell).font = { size: 8, name: 'Tahoma', bold: true };

            ws.mergeCells(this.getCells("L", index_row, "M", index_row).mergeCells);
            ws.getCell(this.getCells("L", index_row, "M", index_row).start_cell, this.getCells("L", index_row, "M", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell(this.getCells("L", index_row, "M", index_row).start_cell, this.getCells("L", index_row, "M", index_row).end_cell).font = { size: 8, name: 'Tahoma' };
            //end row

            //start row
            ws.addRow('');
            index_row = index_row + 1;
            ws.getRow(index_row).height = 8;
            //end row

            //start row
            const row_herder = ws.addRow(['STT', 'Mã SV', 'Họ và Tên', '', 'Ng/Sinh', 'Tên lớp', 'CC', 'TBC KT theo bài', 'Điểm TX', '', '', 'TBC ĐTP(*)', 'Số tiết nghỉ', 'Ghi chú']);
            index_row = index_row + 1;
            ws.getRow(index_row).height = 26.75;

            row_herder.eachCell((cell, number) => {
                cell.font = { size: 8, name: 'Tahoma' };
                cell.alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: '333333' } },
                    left: { style: 'thin', color: { argb: '333333' } },
                    bottom: { style: 'thin', color: { argb: '333333' } },
                    right: { style: 'thin', color: { argb: '333333' } }
                };
            });

            ws.mergeCells(this.getCells("C", index_row, "D", index_row).mergeCells);
            ws.mergeCells(this.getCells("I", index_row, "K", index_row).mergeCells);
            //end row

            //start rows data
            data_.forEach((f, key) => {
                const birthday = f['profile'] ? f['profile']['birthday'] : '';

                let sum_tx = 0;
                let count_tx = 0;

                if (f.tx1 >= 0) {
                    sum_tx = sum_tx + f.tx1;
                    count_tx = count_tx + 1;
                }

                if (f.tx2 >= 0) {
                    sum_tx = sum_tx + f.tx2;
                    count_tx = count_tx + 1;
                }

                if (f.tx3 >= 0) {
                    sum_tx = sum_tx + f.tx3;
                    count_tx = count_tx + 1;
                }

                const ho = f['profile']['full_name'].split(" ");
                ho.splice(ho.length - 1, 1);

                const tbc = f.cc >= 0 && count_tx !== 0 && f.bttn >= 0 ? parseFloat(((f.cc * 5 + f.bttn * 10 + sum_tx / count_tx * 35) / 50).toFixed(1)) : '';
                const data_row = [
                    (key + 1).toString(),
                    f.student_code,
                    ho.join(" "),
                    f.ten,
                    birthday,
                    f['class_kyhieu'],
                    f.cc >= 0 ? f.cc : '',
                    f.bttn >= 0 ? f.bttn : '',
                    f.tx1 >= 0 ? f.tx1 : '',
                    f.tx2 >= 0 ? f.tx2 : '',
                    f.tx3 >= 0 ? f.tx3 : '',
                    tbc,
                    f['so_tietnghi'],
                    f['nghi_20_pecent'] || f['check_ban'] ? 'CT' : ''
                ]

                const row = ws.addRow(data_row);

                index_row = index_row + 1;

                // if (f.bttn >= 0) {
                //     ws.getCell(`H${index_row}`).value = {
                //         formula: `ROUND(${f.bttn})`,
                //         result: tbc
                //     } as CellValue;
                // }

                if (f.tx1 >= 0) {
                    ws.getCell(`I${index_row}`).value = {
                        formula: `ROUND(${f.tx1},0)`,
                        result: f.tx1
                    } as CellValue;
                }

                if (f.tx2 >= 0) {
                    ws.getCell(`J${index_row}`).value = {
                        formula: `ROUND(${f.tx2},0)`,
                        result: f.tx2
                    } as CellValue;
                }

                if (f.tx3 >= 0) {
                    ws.getCell(`K${index_row}`).value = {
                        formula: `ROUND(${f.tx3},0)`,
                        result: f.tx3
                    } as CellValue;
                }


                const formula = `IFERROR(ROUND((G${index_row}*5+H${index_row}*10+(SUM(I${index_row}:K${index_row})/COUNT(I${index_row}:K${index_row}))*35)/50,1),"")`;

                ws.getCell(`L${index_row}`).value = {
                    formula: formula,
                    result: tbc
                } as CellValue;



                ws.getRow(index_row).height = 14;

                row.eachCell((cell, number) => {
                    if (number === 3 || number === 4) {
                        cell.font = { name: 'Tahoma', size: 8, };
                        cell.alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left', };
                    } else {
                        cell.font = { name: 'Tahoma', size: 8, };
                        cell.alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center', };
                    }

                    if (number === 3) {
                        cell.border = {
                            top: { style: 'thin', color: { argb: '333333' } },
                            left: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                        };
                    } else if (number === 4) {
                        cell.border = {
                            top: { style: 'thin', color: { argb: '333333' } },
                            bottom: { style: 'thin', color: { argb: '333333' } },
                            right: { style: 'thin', color: { argb: '333333' } }
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
            })
            //end rows data

            //start row
            ws.addRow('');
            index_row = index_row + 1;
            ws.getRow(index_row).height = 8;
            //end row

            //start row
            ws.addRow(['Số SV đủ điều kiện dự thi học phần: '.concat(data_.filter(m => !m['nghi_20_pecent'] && !m['check_ban']).length.toString())]);
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17.75;

            ws.mergeCells(this.getCells("A", index_row, "F", index_row).mergeCells);
            ws.getCell(this.getCells("A", index_row, "F", index_row).start_cell, this.getCells("A", index_row, "F", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            ws.getCell(this.getCells("A", index_row, "F", index_row).start_cell, this.getCells("A", index_row, "F", index_row).end_cell).font = { size: 9, name: 'Tahoma' };
            //end row

            //start row
            const row_SM = ws.addRow(['Số SV không đủ điều kiện dự thi học phần: '.concat(data_.filter(m => m['nghi_20_pecent'] || m['check_ban']).length.toString())].concat(Array(4).fill(""), ['Mã SV không đủ ĐKDTHP (CT): '.concat(data_.filter(m => m['nghi_20_pecent'] || m['check_ban']).map(m => m.student_code).join(", "))]));
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17.75;

            row_SM.eachCell((cell, number) => {
                cell.font = { size: 9, name: 'Tahoma' };
                cell.alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'left' };
            });
            ws.mergeCells(this.getCells("A", index_row, "E", index_row).mergeCells);
            ws.mergeCells(this.getCells("F", index_row, "N", index_row).mergeCells);
            //end row

            //start row
            ws.addRow('');
            index_row = index_row + 1;
            ws.getRow(index_row).height = 8;
            //end row

            //start row
            const today = new Date();
            ws.addRow(Array(8).fill("").concat(['Ngày ' + today.getDate().toString() + ' Tháng ' + (today.getMonth() + 1).toString() + ' Năm ' + today.getFullYear().toString()]));
            index_row = index_row + 1;
            ws.getRow(index_row).height = 17.75;

            ws.mergeCells(this.getCells("I", index_row, "N", index_row).mergeCells);
            ws.getCell(this.getCells("I", index_row, "N", index_row).start_cell, this.getCells("I", index_row, "N", index_row).end_cell).alignment = { shrinkToFit: true, vertical: 'middle', horizontal: 'center' };
            ws.getCell(this.getCells("I", index_row, "N", index_row).start_cell, this.getCells("I", index_row, "N", index_row).end_cell).font = { size: 9, name: 'Tahoma' };
            //end row

            //start row
            const row_CTT = ws.addRow(['CÁN BỘ GIẢNG DẠY'].concat(Array(2).fill(""), ['TRƯỞNG BỘ MÔN'], Array(3).fill(""), ['TRƯỞNG KHOA QLND ĐÀO TẠO']));
            index_row = index_row + 1;


            row_CTT.eachCell((cell, number) => {
                cell.font = { size: 9, name: 'Tahoma', bold: true };;
                cell.alignment = { shrinkToFit: true, vertical: 'top', horizontal: 'center' };
            });
            ws.mergeCells(this.getCells("A", index_row, "C", index_row).mergeCells);
            ws.mergeCells(this.getCells("D", index_row, "G", index_row).mergeCells);
            ws.mergeCells(this.getCells("H", index_row, "N", index_row).mergeCells);
            ws.getRow(index_row).height = 60.5;
            //end row

            //start row
            ws.addRow('');
            index_row = index_row + 1;
            ws.getRow(index_row).height = 8;
            ws.getRow(index_row).addPageBreak()
            //end row
        })

        wb.xlsx.writeBuffer().then((data) => {
            this.saveExcelFile(data, "BDTX".concat('-', _class.name.replace(/\/|\.|\\/gi, '-')));
        });
    }

    getCells(col_start: string, row_start: number, col_end: string, row_end: number): { mergeCells: string, start_cell: string, end_cell: string } {
        const start_cell = ''.concat(col_start, row_start.toString());
        const end_cell = ''.concat(col_end, row_end.toString());
        return { mergeCells: start_cell.concat(":", end_cell), start_cell: start_cell, end_cell: end_cell };
    }

    pixelsToWidth(pixels: number, MDW = 7): number {
        if (pixels <= 0) return 0;
        return (Math.floor((pixels / MDW) * 256)) / 256;

    }
}