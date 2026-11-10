import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject } from '@modules/shared/models/subject';
import { HelperService } from '@core/services/helper.service';
import { SubjectClo } from '@modules/shared/models/subject-clo';
import { SubjectMuctieuChitiet } from '@modules/shared/models/subject-muctieu-chitiet';
import { SubjectCloService } from '@modules/shared/services/subject-clo.service';
import { SubjectMuctieuChitietService } from '@modules/shared/services/subject-muctieu-chitiet.service';
import { SubjectService } from '@modules/shared/services/subject.service';
import { OpenFileManagerService } from '@modules/shared/services/open-file-manager.service';
import { NotificationService } from '@core-new/service/notification.service';
import { ConditionOption } from '@modules/shared/models/condition-option';
import { SubjectTemplateDetailComponent } from './subject-template-detail.component';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject as RxSubject, of, throwError } from 'rxjs';

describe('SubjectTemplateDetailComponent', () => {
    let fixture: ComponentFixture<SubjectTemplateDetailComponent>;
    let component: SubjectTemplateDetailComponent;
    let root: HTMLElement;

    let mockMuctieuService: jasmine.SpyObj<SubjectMuctieuChitietService>;
    let mockCloService: jasmine.SpyObj<SubjectCloService>;
    let mockSubjectService: jasmine.SpyObj<SubjectService>;
    let mockFileManager: jasmine.SpyObj<OpenFileManagerService>;
    let mockNotificationService: jasmine.SpyObj<NotificationService>;

    const subject: Subject = {
        id: 12,
        name: 'Lập trình Web nâng cao',
        code: 'WEB201',
        desc: 'Mô tả mẫu',
        sotinchi: 3,
        sotinchi_th: 1,
        params: { tongsogio: 45, lythuyet: 30, unknown_custom: 'preserved' },
        av: 1,
        muctieu: '<p>Mục tiêu chung</p>',
        yeucau_sinhvien: '<p>Yêu cầu</p>',
        tailieu_chinh: [{ ordering: 1, type: 'link', title: 'Tài liệu A', link: 'https://a.test' }],
        tailieu_thamkhao: []
    } as Subject;

    const initialGoals: SubjectMuctieuChitiet[] = [
        { id: 101, subject_id: 12, ordering: 1, kyhieu: 'CO1', noidung: 'Hiểu kiến thức Web' },
        { id: 102, subject_id: 12, ordering: 2, kyhieu: 'CO2', noidung: 'Xây dựng ứng dụng Web' }
    ];

    const initialClos: SubjectClo[] = [
        { id: 201, subject_id: 12, subject_muctieu_chitiet_id: 101, ordering: 1, kyhieu: 'CLO1', noidung: 'Nắm vững HTML/CSS' },
        { id: 202, subject_id: 12, subject_muctieu_chitiet_id: 102, ordering: 2, kyhieu: 'CLO2', noidung: 'Viết mã TypeScript' }
    ];

    beforeEach(async () => {
        mockMuctieuService = jasmine.createSpyObj<SubjectMuctieuChitietService>('SubjectMuctieuChitietService', [
            'getByPageNew', 'add', 'update', 'delete'
        ]);
        mockCloService = jasmine.createSpyObj<SubjectCloService>('SubjectCloService', [
            'getByPageNew', 'add', 'update', 'delete'
        ]);
        mockSubjectService = jasmine.createSpyObj<SubjectService>('SubjectService', ['update']);
        mockFileManager = jasmine.createSpyObj<OpenFileManagerService>('OpenFileManagerService', ['openFileManagerNew']);
        mockNotificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['toastSuccess', 'toastError', 'toastWarning']);

        mockMuctieuService.getByPageNew.and.returnValue(of({ data: [...initialGoals], recordsFiltered: 2 }));
        mockCloService.getByPageNew.and.returnValue(of({ data: [...initialClos], recordsFiltered: 2 }));
        mockMuctieuService.add.and.callFake((data) => of({ id: 103, ...data } as SubjectMuctieuChitiet));
        mockCloService.add.and.callFake((data) => of({ id: 203, ...data } as SubjectClo));
        mockMuctieuService.update.and.callFake((id, data) => of({ id, ...data } as SubjectMuctieuChitiet));
        mockCloService.update.and.callFake((id, data) => of({ id, ...data } as SubjectClo));
        mockMuctieuService.delete.and.returnValue(of(null));
        mockCloService.delete.and.returnValue(of(null));
        mockSubjectService.update.and.callFake((id, data) => of({ id, ...subject, ...data } as Subject));

        await TestBed.configureTestingModule({
            imports: [SubjectTemplateDetailComponent],
            providers: [
                provideNoopAnimations(),
                { provide: HelperService, useValue: { decodeHTML: (value: string) => value, encodeHTML: (value: string) => value } },
                { provide: SubjectMuctieuChitietService, useValue: mockMuctieuService },
                { provide: SubjectCloService, useValue: mockCloService },
                { provide: SubjectService, useValue: mockSubjectService },
                { provide: OpenFileManagerService, useValue: mockFileManager },
                { provide: NotificationService, useValue: mockNotificationService }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(SubjectTemplateDetailComponent);
        component = fixture.componentInstance;
        fixture.componentRef.setInput('subject', subject);
        root = fixture.nativeElement;
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();
    });

    function sidebarButtons(): HTMLButtonElement[] {
        return Array.from(root.querySelectorAll<HTMLButtonElement>('.subject-template__item'));
    }

    it('nhận dữ liệu Subject và hiển thị header cấu hình', () => {
        expect(component.selectedSubject()).toEqual(subject);
        expect(component.form.controls.name.value).toBe('Lập trình Web nâng cao');
        expect(component.form.controls.code.value).toBe('WEB201');
        expect(component.form.controls.sotinchi.value).toBe(3);
        expect(component.form.controls.sotinchi_th.value).toBe(1);
        expect(component.form.controls.av.value).toBe(1);
        expect(component.form.controls.tongsogio.value).toBe(45);
        expect(component.materials.tailieu_chinh.length).toBe(1);
        expect(root.querySelector('h1')?.textContent).toContain('Cấu hình môn học: Lập trình Web nâng cao');
    });

    it('hiển thị hai nhóm trong sidebar và 9 mục con có nút Lưu tương ứng', () => {
        const groups = Array.from(root.querySelectorAll<HTMLButtonElement>('.subject-template__group-title'));
        expect(groups.map(group => group.textContent?.trim())).toEqual(['Thông tin chung', 'Mục tiêu/CĐR']);

        const items = sidebarButtons();
        expect(items.length).toBe(9);
    });

    it('chuyển đổi item hiển thị form tương ứng bằng @if/@else', () => {
        const items = sidebarButtons();
        expect(items[0].getAttribute('aria-current')).toBe('page');
        expect(root.querySelector('#template-info-title')).not.toBeNull();

        items[1].click();
        fixture.detectChanges();
        expect(component.activeItemId()).toBe('exam-format');
        expect(root.querySelector('#template-format-title')).not.toBeNull();
        expect(root.querySelector('#template-info-title')).toBeNull();

        items[6].click();
        fixture.detectChanges();
        expect(component.activeGroupId()).toBe('objectives-cdr');
        expect(component.activeItemId()).toBe('goals');
        expect(root.querySelector('#template-goals-title')).not.toBeNull();
    });

    it('hỗ trợ phím mũi tên trong từng nhóm sidebar', () => {
        const items = sidebarButtons();
        items[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeItemId()).toBe('exam-format');

        items[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeItemId()).toBe('outline');

        items[4].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
        fixture.detectChanges();
        expect(component.activeItemId()).toBe('subject-info');
    });

    it('thêm link tài liệu và chọn file qua file manager lưu trữ', async () => {
        component.materialLinkDrafts.tailieu_chinh = { title: 'Tài liệu link', link: 'https://test.link' };
        component.addMaterialLink('tailieu_chinh');
        expect(component.materials.tailieu_chinh.some(item => item.title === 'Tài liệu link')).toBeTrue();

        mockFileManager.openFileManagerNew.and.resolveTo([{ id: 88, name: 'file.pdf', title: 'Giáo trình file', size: 1024, ext: 'pdf' } as any]);
        await component.chooseMaterialFiles('tailieu_chinh');
        expect(component.materials.tailieu_chinh.some(item => item.title === 'Giáo trình file')).toBeTrue();
    });

    it('emit back khi nhấn nút X đỏ', () => {
        const backSpy = jasmine.createSpy('back');
        component.back.subscribe(backSpy);
        root.querySelector<HTMLButtonElement>('.subject-template__close-button')?.click();
        expect(backSpy).toHaveBeenCalledTimes(1);
    });

    it('hiển thị loading progress khi appState là loading', () => {
        component.appState.set('loading');
        fixture.detectChanges();
        expect(root.querySelector('app-loading-progress')).not.toBeNull();
    });

    it('tải CO/CLO đúng điều kiện subject_id và sắp xếp theo ordering', () => {
        expect(mockMuctieuService.getByPageNew).toHaveBeenCalled();
        expect(mockCloService.getByPageNew).toHaveBeenCalled();

        const callCondition = mockMuctieuService.getByPageNew.calls.mostRecent().args[0] as ConditionOption;
        expect(callCondition.condition[0].value).toBe('12');
        expect(component.goals.length).toBe(2);
        expect(component.goals[0].kyhieu).toBe('CO1');
        expect(component.outcomes.length).toBe(2);
        expect(component.outcomes[0].kyhieu).toBe('CLO1');
        expect(component.hasObjectiveData()).toBeTrue();
        expect(component.appState()).toBe('success');
    });

    it('hiển thị lỗi và đặt appState error khi tải CO/CLO thất bại', async () => {
        mockMuctieuService.getByPageNew.and.returnValue(throwError(() => new Error('Server error')));
        fixture.componentRef.setInput('subject', { id: 99, name: 'Lỗi' } as Subject);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(component.appState()).toBe('error');
        expect(component.hasObjectiveData()).toBeFalse();
        expect(component.appState()).toBe('error');
        expect(component.goals.length).toBe(0);
    });

    it('thêm CO mới trực tiếp qua API và mở editor inline ở dòng mới', async () => {
        await component.addGoal();
        fixture.detectChanges();

        expect(mockMuctieuService.add).toHaveBeenCalledWith(jasmine.objectContaining({
            subject_id: 12,
            ordering: 3,
            kyhieu: 'CO3',
            noidung: ''
        }));
        expect(component.goals.length).toBe(3);
        expect(component.editingGoalId()).toBe(103);
    });

    it('thêm CLO mới trực tiếp qua API và mở editor inline ở dòng mới', async () => {
        await component.addOutcome();
        fixture.detectChanges();

        expect(mockCloService.add).toHaveBeenCalledWith(jasmine.objectContaining({
            subject_id: 12,
            ordering: 3,
            kyhieu: 'CLO3',
            noidung: '',
            subject_muctieu_chitiet_id: null
        }));
        expect(component.outcomes.length).toBe(3);
        expect(component.editingOutcomeId()).toBe(203);
    });

    it('bấm nút sửa mở textarea inline trong ô Nội dung cho CO và CLO', () => {
        component.beginGoalEdit(component.goals[0]);
        expect(component.editingGoalId()).toBe(101);
        expect(component.goalDraft).toBe('Hiểu kiến thức Web');

        component.cancelObjectiveEdit();
        expect(component.editingGoalId()).toBeNull();

        component.beginOutcomeEdit(component.outcomes[0]);
        expect(component.editingOutcomeId()).toBe(201);
        expect(component.outcomeDraft).toBe('Nắm vững HTML/CSS');
    });

    it('nút Lưu mục tiêu (CO) gửi payload mới, không GET lại và giữ nguyên UI nếu PUT trả giá trị cũ', async () => {
        component.beginGoalEdit(component.goals[0]);
        component.goalDraft = 'Nội dung CO1 sửa';
        mockMuctieuService.update.and.returnValue(of({ id: 101, noidung: 'Giá trị cũ server' } as any));

        const getCallsBefore = mockMuctieuService.getByPageNew.calls.count();
        await component.saveGoals();
        fixture.detectChanges();

        expect(mockMuctieuService.update).toHaveBeenCalledWith(101, {
            noidung: 'Nội dung CO1 sửa',
            ordering: 1,
            kyhieu: 'CO1'
        });
        expect(mockMuctieuService.getByPageNew.calls.count()).toBe(getCallsBefore);
        expect(component.goals[0].noidung).toBe('Nội dung CO1 sửa');
        expect(component.editingGoalId()).toBeNull();
    });

    it('nút Lưu chuẩn đầu ra (CLO) gửi payload mới và không GET lại sau lưu', async () => {
        component.beginOutcomeEdit(component.outcomes[0]);
        component.outcomeDraft = 'Nội dung CLO1 sửa';
        mockCloService.update.and.returnValue(of({ id: 201, noidung: null } as any));

        const getCallsBefore = mockCloService.getByPageNew.calls.count();
        await component.saveOutcomes();
        fixture.detectChanges();

        expect(mockCloService.update).toHaveBeenCalledWith(201, {
            noidung: 'Nội dung CLO1 sửa',
            ordering: 1,
            kyhieu: 'CLO1'
        });
        expect(mockCloService.getByPageNew.calls.count()).toBe(getCallsBefore);
        expect(component.outcomes[0].noidung).toBe('Nội dung CLO1 sửa');
    });

    it('lưu thất bại giữ draft để thử lại', async () => {
        mockMuctieuService.update.and.returnValue(throwError(() => new Error('Save failed')));
        component.beginGoalEdit(component.goals[0]);
        component.goalDraft = 'Nội dung lỗi';

        await component.saveGoals();
        fixture.detectChanges();

        expect(mockNotificationService.toastError).toHaveBeenCalled();
        expect(component.goalContent(component.goals[0])).toBe('Nội dung lỗi');
    });

    it('xóa CO: gọi delete, cập nhật liên kết CLO về null và đánh lại thứ tự', async () => {
        await component.removeGoal(0);
        fixture.detectChanges();

        expect(mockMuctieuService.delete).toHaveBeenCalledWith(101);
        expect(mockCloService.update).toHaveBeenCalledWith(201, { subject_muctieu_chitiet_id: null });
        expect(mockMuctieuService.update).toHaveBeenCalledWith(102, { ordering: 1, kyhieu: 'CO1' });
        expect(component.goals.length).toBe(1);
    });

    it('reorderRows cập nhật thứ tự CO qua API', async () => {
        const reordered = [initialGoals[1], initialGoals[0]];
        component.goals = reordered;

        await component.reorderRows('goals');
        fixture.detectChanges();

        expect(mockMuctieuService.update).toHaveBeenCalledWith(102, { ordering: 1, kyhieu: 'CO1' });
        expect(mockMuctieuService.update).toHaveBeenCalledWith(101, { ordering: 2, kyhieu: 'CO2' });
    });

    it('setOutcomeGoal chỉ draft cục bộ, saveOutcomeLinks mới gửi API PUT', async () => {
        const clo = component.outcomes[0];
        component.setOutcomeGoal(clo, 102);
        expect(mockCloService.update).not.toHaveBeenCalled();
        expect(component.outcomeGoal(clo)).toBe(102);

        await component.saveOutcomeLinks();
        expect(mockCloService.update).toHaveBeenCalledWith(201, { subject_muctieu_chitiet_id: 102 });
        expect(component.outcomes[0].subject_muctieu_chitiet_id).toBe(102);
    });

    it('lưu thông tin môn học chỉ gửi 4 trường bắt buộc name, code, sotinchi, sotinchi_th', async () => {
        component.form.controls.name.setValue('Tên mới');
        component.form.controls.code.setValue('CODE-1');
        component.form.controls.sotinchi.setValue(4);
        component.form.controls.sotinchi_th.setValue(1);

        await component.saveSubjectInfo();
        expect(mockSubjectService.update).toHaveBeenCalledWith(12, {
            name: 'Tên mới',
            code: 'CODE-1',
            sotinchi: 4,
            sotinchi_th: 1
        });
    });

    it('lưu khối lượng học tập hợp nhất params và giữ lại các key không đổi', async () => {
        component.form.controls.tongsogio.setValue(60);
        component.form.controls.lythuyet.setValue(40);

        await component.saveLearningVolume();
        expect(mockSubjectService.update).toHaveBeenCalledWith(12, {
            params: jasmine.objectContaining({
                unknown_custom: 'preserved',
                tongsogio: 60,
                lythuyet: 40
            })
        });
    });

    it('lưu đề cương chỉ gửi desc và yeucau_sinhvien', async () => {
        component.form.controls.desc.setValue('<p>Mô tả đề cương</p>');
        component.form.controls.yeucau_sinhvien.setValue('<p>Yêu cầu sinh viên</p>');

        await component.saveOutline();
        expect(mockSubjectService.update).toHaveBeenCalledWith(12, {
            desc: '<p>Mô tả đề cương</p>',
            yeucau_sinhvien: '<p>Yêu cầu sinh viên</p>'
        });
    });

    it('lưu mục tiêu chung gửi muctieu', async () => {
        component.form.controls.muctieu.setValue('<p>Mục tiêu sửa</p>');
        await component.saveGeneralObjective();
        expect(mockSubjectService.update).toHaveBeenCalledWith(12, {
            muctieu: '<p>Mục tiêu sửa</p>'
        });
    });

    it('lưu tài liệu gửi hai mảng tailieu_chinh và tailieu_thamkhao', async () => {
        await component.saveMaterials();
        expect(mockSubjectService.update).toHaveBeenCalledWith(12, jasmine.objectContaining({
            tailieu_chinh: jasmine.any(Array),
            tailieu_thamkhao: jasmine.any(Array)
        }));
    });

    it('mỗi mục con có đúng một nút Lưu trong header, không có nút Lưu toàn trang', () => {
        const labels = [
            'Lưu thông tin môn học', 'Lưu định dạng kiểm tra', 'Lưu khối lượng học tập',
            'Lưu tài liệu', 'Lưu đề cương', 'Lưu mục tiêu chung',
            'Lưu mục tiêu', 'Lưu chuẩn đầu ra', 'Lưu liên kết'
        ];
        expect(root.querySelector('.subject-template__header [aria-label^="Lưu"]')).toBeNull();
        sidebarButtons().forEach((button, index) => {
            button.click();
            fixture.detectChanges();
            const saves = root.querySelectorAll<HTMLElement>('.subject-template__content [aria-label^="Lưu"]');
            expect(saves.length).withContext(labels[index]).toBe(1);
            expect(saves[0].getAttribute('aria-label')).toBe(labels[index]);
        });
    });

    it('các mục tùy chọn lưu được khi form thông tin môn học không hợp lệ', async () => {
        component.form.controls.name.setValue('');
        component.form.controls.code.setValue('');
        component.form.controls.av.setValue(null);
        component.form.controls.muctieu.setValue('');
        component.form.controls.desc.setValue('');
        component.form.controls.yeucau_sinhvien.setValue('');
        component.form.controls.tongsogio.setValue(null);
        await component.saveExamFormat();
        await component.saveGeneralObjective();
        await component.saveLearningVolume();
        await component.saveOutline();
        await component.saveMaterials();
        expect(mockSubjectService.update.calls.allArgs().map(([, payload]) => payload)).toEqual([
            { av: null }, { muctieu: '' }, jasmine.objectContaining({ params: jasmine.objectContaining({ tongsogio: null }) }),
            { desc: '', yeucau_sinhvien: '' }, jasmine.objectContaining({ tailieu_chinh: jasmine.any(Array), tailieu_thamkhao: [] })
        ]);
        expect(component.appState()).toBe('success');
    });

    it('PUT môn học trả response cũ vẫn giữ từng giá trị đã lưu và draft ở mục khác', async () => {
        mockSubjectService.update.and.returnValue(of(subject));
        component.form.controls.av.setValue(2);
        component.form.controls.muctieu.setValue('Mục tiêu chưa lưu');
        component.selectItem('general-info', 'exam-format');
        await component.saveExamFormat();
        expect(component.selectedSubject()?.av).toBe(2);
        expect(component.form.controls.av.value).toBe(2);
        expect(component.form.controls.muctieu.value).toBe('Mục tiêu chưa lưu');
        expect(component.activeItemId()).toBe('exam-format');
        expect(mockMuctieuService.getByPageNew).toHaveBeenCalledTimes(1);
        expect(mockCloService.getByPageNew).toHaveBeenCalledTimes(1);
    });

    it('lưu params giữ key cũ và giá trị 0, không reset form', async () => {
        component.form.controls.lythuyet.setValue(0);
        component.form.controls.tongsogio.setValue(0);
        mockSubjectService.update.and.returnValue(of(null as any));
        await component.saveLearningVolume();
        expect(component.selectedSubject()?.params).toEqual(jasmine.objectContaining({
            unknown_custom: 'preserved', lythuyet: 0, tongsogio: 0
        }));
        expect(component.form.controls.lythuyet.value).toBe(0);
    });

    it('lưu tài liệu giữ metadata file, không gửi id UI và không gọi GET', async () => {
        const file = { id: 8, name: 'b.pdf', title: 'B', url: '/b.pdf', ext: 'pdf', size: 10 };
        mockFileManager.openFileManagerNew.and.resolveTo([file]);
        await component.chooseMaterialFiles('tailieu_chinh');
        await component.saveMaterials();
        const payload = mockSubjectService.update.calls.mostRecent().args[1];
        expect(payload.tailieu_chinh?.[1]).toEqual({ ordering: 2, type: 'file', title: 'B', file });
        expect(component.materials.tailieu_chinh[1].file?.id).toBe(8);
        expect(mockMuctieuService.getByPageNew).toHaveBeenCalledTimes(1);
    });

    it('nhấp liên kết chỉ đổi draft; PUT lỗi giữ lựa chọn để thử lại', async () => {
        const outcome = component.outcomes[0];
        component.setOutcomeGoal(outcome, 102);
        mockCloService.update.and.returnValue(throwError(() => new Error('offline')));
        await component.saveOutcomeLinks();
        expect(component.appState()).toBe('success');
        expect(mockNotificationService.toastError).toHaveBeenCalled();
        expect(component.outcomeGoal(component.outcomes[0])).toBe(102);
        expect(component.outcomes[0].subject_muctieu_chitiet_id).toBe(101);
        mockCloService.update.and.returnValue(of(null as any));
        await component.saveOutcomeLinks();
        expect(component.appState()).toBe('success');
        expect(component.outcomes[0].subject_muctieu_chitiet_id).toBe(102);
    });

    it('khi PUT chờ, appState và progress duy trì; không gửi hai request trùng', fakeAsync(() => {
        const pending$ = new RxSubject<Subject>();
        mockSubjectService.update.and.returnValue(pending$);
        component.form.controls.av.setValue(2);
        const saving = component.saveExamFormat();
        fixture.detectChanges();
        expect(component.appState()).toBe('loading');
        expect(root.querySelector('app-loading-progress')).not.toBeNull();
        void component.saveExamFormat();
        expect(mockSubjectService.update).toHaveBeenCalledTimes(1);
        pending$.next(subject);
        pending$.complete();
        tick();
        expect(component.appState()).toBe('success');
        expect(component.form.controls.av.value).toBe(2);
        void saving;
    }));

    it('không ghi đè dữ liệu môn mới khi response của môn cũ đến trễ', fakeAsync(() => {
        const oldGoals$ = new RxSubject<{ data: SubjectMuctieuChitiet[]; recordsFiltered: number }>();
        const oldClos$ = new RxSubject<{ data: SubjectClo[]; recordsFiltered: number }>();
        const newGoals$ = new RxSubject<{ data: SubjectMuctieuChitiet[]; recordsFiltered: number }>();
        const newClos$ = new RxSubject<{ data: SubjectClo[]; recordsFiltered: number }>();
        mockMuctieuService.getByPageNew.and.returnValues(oldGoals$, newGoals$);
        mockCloService.getByPageNew.and.returnValues(oldClos$, newClos$);

        fixture.componentRef.setInput('subject', { ...subject, id: 55, name: 'Môn A' });
        fixture.detectChanges();
        fixture.componentRef.setInput('subject', { ...subject, id: 66, name: 'Môn B' });
        fixture.detectChanges();
        expect(oldGoals$.observed).toBeFalse();
        expect(oldClos$.observed).toBeFalse();

        oldGoals$.next({ data: [{ id: 999, subject_id: 55, ordering: 1, kyhieu: 'CO1', noidung: 'Cũ' }], recordsFiltered: 1 });
        oldGoals$.complete();
        oldClos$.next({ data: [], recordsFiltered: 0 });
        oldClos$.complete();
        newGoals$.next({ data: [{ id: 1000, subject_id: 66, ordering: 1, kyhieu: 'CO1', noidung: 'Mới' }], recordsFiltered: 1 });
        newGoals$.complete();
        newClos$.next({ data: [], recordsFiltered: 0 });
        newClos$.complete();
        tick();

        expect(component.goals.map(goal => goal.subject_id)).toEqual([66]);
        expect(component.appState()).toBe('success');
    }));
});
