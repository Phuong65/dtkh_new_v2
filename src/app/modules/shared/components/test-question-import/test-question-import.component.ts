import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { HelperService } from '@core/services/helper.service';
import mammothPlus from 'mammoth-plus';
import { MathMLToLaTeX } from 'mathml-to-latex';
import * as latex_js from 'latex.js';
import { OvicGroupsRadioV2Component } from '../ovic-groups-radio-v2/ovic-groups-radio-v2.component';
import { PipeCheckImg } from '../../pipes/pipe-check-img';
import { OvicGroupsCheckboxComponent } from '../ovic-groups-checkbox/ovic-groups-checkbox.component';
import { CommonModule } from '@angular/common';
import { AudioViewerComponent } from '../audio-viewer/audio-viewer.component';
import { RawHtmlPipe } from '../../pipes/innerhtml-raw-pipe';
import { FormsModule } from '@angular/forms';

@Component({standalone: true, 
    selector: 'test-question-import',
    templateUrl: './test-question-import.component.html',
    styleUrls: ['./test-question-import.component.css'],
    imports: [OvicGroupsRadioV2Component, PipeCheckImg, OvicGroupsCheckboxComponent, CommonModule, 
        AudioViewerComponent, RawHtmlPipe,FormsModule]
})
export class TestQuestionImportComponent implements OnInit, OnChanges {
    @Input() fileInput: File;

    @Input() questionType: 'grouping' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'input' | 'drag-drop' | 'reorder_words';

    @Output() onReturnResult = new EventEmitter<any>();

    questionImport: any;

    hasContent = false;

    arrayIdImages = [];

    option_show_anwser_col = [
        { value: 1 },
        { value: 2 },
        { value: 3 },
        { value: 4 },
    ]

    checkQuestion = {
        noAnswerCorrect: 0,
        noAnswerCorrectArray: []
    }

    type: 'grouping' | 'radio' | 'checkbox' | 'group-radio' | 'group-input' | 'input' | 'drag-drop' | 'reorder_words';

    constructor(
        private helperService: HelperService
    ) {

    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['fileInput']) {
            this.hasContent = false;
            this.onReadFile();
        }

        if (changes['questionType']) {
            this.hasContent = false;
            this.type = this.questionType;
            this.questionImport = null;
        }
    }

    ngOnInit(): void {

    }

    onReadFile() {
        if (this.fileInput) {
            this.hasContent = false;
            const file = this.fileInput;
            const indexDot = file.name.lastIndexOf(".");
            let codeFile = '';

            if (indexDot !== -1) {
                codeFile = file.name.slice(0, indexDot);
            }

            var options = {
                ignoreEmptyParagraphs: true,
                includeDefaultStyleMap: false,
                includeEmbeddedStyleMap: false,
            }

            const reader = new FileReader();
            reader.readAsArrayBuffer(file);
            reader.onloadend = async (event) => {
                const localUrl = reader.result;
                mammothPlus.convertToHtml({ arrayBuffer: localUrl }, options).then((result) => {
                    const html = result.value;
                    const regex = /<([^>]+)>/ig;
                    const regexSrcG = /src="(.*?)"/g;
                    const arrayFile = [];
                    let i = 0;

                    const string_latex = result.value.replace(/\$(.*?)\$|<math(.*?)<\/math>/gi, re => {
                        let latex = re;
                        const index = re.indexOf('<math');
                        if (index !== -1) {
                            latex = '$' + MathMLToLaTeX.convert(re) + '$';
                        }
                        let generator = new latex_js.HtmlGenerator({ hyphenate: false });
                        generator = latex_js.parse(latex, { generator: generator });
                        const para = document.createElement("div");
                        para.appendChild(generator.domFragment());
                        return para.innerHTML.replace(/<div(.*?)>|<\/div>|<p>|<\/p>/g, '');
                    });

                    const newHtml = string_latex.replace(regexSrcG, (res) => {
                        if (res) {
                            i = i + 1;
                            arrayFile.push({ id: i, file: this.helperService.convertFileFromBase64(res.slice(5, res.length - 1), codeFile + '_anh_' + i + '_(khong_xoa)', true), idUpLoad: '' });
                            return 'class="admin-class-image" data-org="serverAws" data-id="'.concat(i.toString(), '"').concat(res);
                        } else {
                            return '';
                        }
                    });

                    this.arrayIdImages = arrayFile;
                    const noP = newHtml.replace(/<p>([\s]+)<\/p>/g, '').replace(/<p(.*?)>/gi, '<p>').replace(/<p><\/p>|<font(.*?)>|<\font>/g, '').trim();
                    const next = noP.replace(/\#\#\[E\]/g, _res => {
                        return '';
                    })

                    this.getQuestions(next, regex, codeFile);
                }).done();
            };
        }
    }

    getQuestions(word, regex, codeFile) {

        this.checkQuestion.noAnswerCorrect = 0;

        this.checkQuestion.noAnswerCorrectArray = [];

        let arrayWord = [];

        const wordAddKeyPart = word.replace(/##([0-9]+)\#\#/g, (resWord) => {
            if (resWord.length === 6) {
                return '|TMP|'.concat(resWord);
            } else {
                return resWord;
            }
        });

        // const wordAddKeyQuestion = wordAddKeyPart.replace(/##\[Q[0-9]*\]/gi, (_key => {
        //     if (_key && _key.length) {
        //         return '|question|'.concat(_key);
        //     } else {
        //         return _key;
        //     }
        // }))

        arrayWord = wordAddKeyPart.split('|TMP|').filter(m => m !== null && m.trim().length !== 0);

        arrayWord.splice(0, 1);

        const questions = [];

        arrayWord.forEach((ar, key) => {
            questions.push(this.getContentQuesion(ar.trim(), regex, key + 1, codeFile));
        });

        this.questionImport = questions;

        this.hasContent = true;

        this.onReturnResult.emit({ data: this.questionImport, info: this.checkQuestion, imgs: this.arrayIdImages })
    }

    getContentQuesion(ar, regex, keyParent, codeFile) {

        let PART = null;

        let cdr = 0;

        const getPart = ar.replace(/PART(\s*)[0-9]*\.*[0-9]*/, (res) => {
            PART = Number(res.replace("PART", '').trim()) * 10;
            return res;
        })

        const media = { type: null, source: null, path: null, replay: null };

        const newQuestion = getPart.replace(/@@(.*?)]/g, (res => {
            if (res.length) {
                const media_string = res.replace(/@@\[|\]/g, '');
                const arrMedia = media_string.trim().split(' ');
                media.type = arrMedia[0];
                media.source = arrMedia[1];
                media.path = arrMedia[2];
                media.replay = arrMedia[3] ? Number(arrMedia[3]) : 1;
            }
            return '';
        }));

        const tmp = newQuestion.split('##[Q]').filter(m => m !== null && m.trim().length !== 0);

        const direction = tmp.splice(0, 1)[0].trim();

        // const new_direction = this.onHandleTypeInpart(direction).desc;

        // const answer_option = this.onHandleTypeInpart(direction).answer_option;

        const question_direction = direction.replace(/<\/p>/, '').concat('</p>').replace(/<p><\/p>/g, "");

        const part_direction = {
            group_id: 0,
            part: PART ? PART : keyParent * 10,
            question_type: 'radio',
            question_direction: question_direction,
            media: media.path ? media : null,
            question_number: null,
            code: codeFile,
            keyParent: keyParent,
            media_open: false,
            children: []
        };

        if (!part_direction.media) {
            delete part_direction.media;
        }

        tmp.forEach((f, key) => {
            if (f) {
                part_direction.children.push(this.getEachQuestion(f, part_direction.part, key, keyParent, codeFile))
            }
        })

        return part_direction;
    }

    getEachQuestion(quest, PART, keyPart, keyParent, codeFile) {
        const lesTestQuest = {
            group_id: null,
            part: PART ? PART : keyParent * 10,
            question_direction: null,
            question_type: 'radio',
            answer_option: [],
            answer_correct: [],
            // status: 1,
            question_number: keyPart + 1,
            config: { cols: 1 },
            hint: null,
            explain: null,
            code: codeFile,
            keyParent: keyParent,
        };

        const index_hint = quest.indexOf('[HINT] ');
        
        const index_exp = quest.indexOf('[EXP] ');

        if (index_exp !== -1) {
            if (index_hint !== -1) {
                lesTestQuest.hint = quest.trim().slice(index_hint + 7, index_exp).replace(/<p>/g, '').split('</p>').join('');
            }
            lesTestQuest.explain = quest.trim().slice(index_exp + 6, quest.length).replace(/<p>/g, '').split('</p>').join('');
        } else {
            if (index_hint !== -1) {
                lesTestQuest.hint = quest.trim().slice(index_hint + 7, quest.length).replace(/<p>/g, '').split('</p>').join('');
            }
        }
        if (index_exp !== -1 && index_hint !== -1) {
            quest = this.deleteAtIndex(quest, 0, index_hint);
        } else if (index_exp !== -1 && index_hint === -1) {
            quest = this.deleteAtIndex(quest, 0, index_exp);
        }

        const newQuest = [...quest.replace(/\>\s*[A-Z]\.\s/g, ">ANS@##").split(/ANS@##/g)];
        const questTestOnly = newQuest.splice(0, 1);
        questTestOnly[0] = questTestOnly[0].replace(/([0-9]+)\.\s*/, (number) => {
            const questNumber = number.replace(/\D*/g, '');
            lesTestQuest.question_number = questNumber;
            return '';
        }).replace("</p>", '');
        const last_index_p = questTestOnly[0].lastIndexOf('<p>');
        let questNew = questTestOnly[0];
        if (last_index_p !== -1) {
            questNew = questTestOnly[0].slice(0, last_index_p);
        }
        lesTestQuest.question_direction = questNew.trim();
        lesTestQuest.answer_correct = [];
        newQuest.forEach((a, i) => {
            const answer = { id: '', value: '' };
            const index_correct = a.indexOf('##');
            if (index_correct !== -1) {
                lesTestQuest.answer_correct = lesTestQuest.answer_correct.concat([(i + 1).toString()]);
                a = a.replace('##', '');
            }
            answer.id = (i + 1).toString();
            answer.value = a.trim().replace(/<p(.*?)>|<\/p>/gi, '');
            lesTestQuest.answer_option.push(answer);
        });
        if (!lesTestQuest.answer_correct.length) {
            this.checkQuestion.noAnswerCorrect += 1;
            this.checkQuestion.noAnswerCorrectArray.push(" ".concat(lesTestQuest.question_number.toString())
            );
        } else {
            if (lesTestQuest.answer_correct.length > 1) {
                lesTestQuest.question_type = 'checkbox';
                lesTestQuest.answer_correct = [lesTestQuest.answer_correct.toString()];
            }
        }
        return lesTestQuest;
    }



    selectPreviewAudio(part) {
        this.questionImport.forEach(f => {
            f['media_open'] = false;
        })
        part['media_open'] = true;
    }

    onChangeRadioAnswer(quest: any, event) {
        if (event) {
            quest.answer_correct = [event.toString()]
        }
    }

    onChangeCheckboxAnswer(quest: any, event) {
        if (event) {
            quest.answer_correct = [event.toString()]
        }
    }

    deleteAtIndex(s, i, j) {
        return s.substr(i, j);
    }
}
