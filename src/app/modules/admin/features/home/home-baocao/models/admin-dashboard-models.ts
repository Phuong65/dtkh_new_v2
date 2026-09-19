export type AdminDashboardState = 'loading' | 'success' | 'error';

export interface AdminDashboardChartSetting {
	options : any,
	data : any
}

export interface AdminDashboardTableData<T> {
	pageOffset : number,
	page : number;
	data : T[]
}

export interface FacultyInformation {
	departmentName : string;
	totalClasses : number,
	totalCourses : number,
	totalStudents : number,
	behindSchedule : number, // Chậm tiến độ
	dropOut : number, // Nghỉ học
	percentageOfBehindSchedule : number, // Tỉ lệ % chậm tiến độ
	percentageOfDropOut : number, // Tỉ lệ % nghỉ học
}

export interface FacultyRegularPoint {
	id : number,
	departmentName : string,
	totalCourses : number,
	totalClasses : number,
	totalStudents : number,
	totalPointsA : number,
	totalPointsB : number,
	totalPointsC : number,
	totalPointsD : number,
	totalPointsF : number,
	percentageOfAPoints : number,
	percentageOfBPoints : number,
	percentageOfCPoints : number,
	percentageOfDPoints : number,
	percentageOfFPoints : number,
}

export interface CourseReporter {
	id : number,
	title : string,
	code : string,
	credits : number,
	examFormat : 'TRACNGHIEM' | 'THUCHANH',
	categoryId : number,
}
