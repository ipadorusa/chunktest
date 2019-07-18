import elementClosest from 'element-closest';
new elementClosest(window);

import {
    Init, eventTrigger
} from '@saramin/ui-helper';

const Datepicker = function(...arg) {
    // 기본값
    const plugin = new Init(arg);
    let targetNodes = this.targetNodes = Init.setTarget(plugin),
        dataContainer = this.dataContainer = Init.setData(plugin),
        options = this.options = Init.setOptions(plugin, {
            /* 기본 설정 시작 */

            defaultDate : null,
            masterClassName : 'datepicker',
            extraBtn : null,
            rangeSelect : false,
            rangeSelectExtraOutput : null,
            rangeSelectExtraOutputBtn : null,
            monthsPerCalendar : 1,
            monthsPerColumn : 1,

            dateRange : '100y',
            dateRangeFrom : null,
            dateRangeTo : null,

            valueFormat : 'y년 m월 d일',
            valueLeadingZero : false,
            valueMonthNames : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            valueRangeSeperator : ' ~ ',

            calendarWidth : 240,
            calendarMargin : 20,
            calendarUseSelect : false,
            calendarFormat : 'y년 m월',
            calendarLeadingZero : false,
            calendarMonthNames : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
            calendarDayNames : ['일', '월', '화', '수', '목', '금', '토'],
            calendarDayClassNames : ['sunday', '', '', '', '', '', 'saturday'],

            onSelect : null

            /* 기본 설정 끝 */
        }),
        instances = this.instances = [];

    /* 공통으로 사용할 부분 시작 */

    class Calendar {
        constructor(dateObj, el) {
            this.selectedDate = [];
            this.dateObj = new Date(dateObj);
            this.dateObj.setDate(1);
            this.y = dateObj.getFullYear();
            this.m = dateObj.getMonth();
            this.el = el;
            this.layerCreated = false;
            this.todayDate = new Date();
            this.todayDate.setHours(0, 0, 0, 0);
            const minDateY = options.dateRangeFrom.getFullYear(),
                maxDateY = options.dateRangeTo.getFullYear();
            this.dateRangeY = [];
            for(let i = minDateY; i <= maxDateY; i++) {
                this.dateRangeY.push(i);
            }
            this.checkClickOutside = function(e) {
                if(!this.layer.contains(e.target)) {
                    this.closeLayer();
                }
            };
            this.clickOutsideHandler = this.checkClickOutside.bind(this);
        }
        // 날짜 갱신
        updateCurrentDate(dateObject) {
            this.dateObj = new Date(dateObject);
            this.dateObj.setDate(1);
            this.dateObj.setHours(0, 0, 0, 0);
            this.y = dateObject.getFullYear();
            this.m = dateObject.getMonth();
        }
        // 날짜 출력 포맷
        formatValue(dateObj) {
            let y = dateObj.getFullYear(),
                m = options.valueMonthNames[dateObj.getMonth()],
                d = dateObj.getDate(),
                f = options.valueFormat.toLowerCase().replace(/(.)\1+/g, '$1'); // 반복문자 제거
            if(f.search('y') !== -1) {
                f = f.replace('y', y);
            }
            if(f.search('m') !== -1) {
                if(options.valueLeadingZero && typeof m === 'number' && m.toString().length < 2) {
                    f = f.replace('m', '0' + m);
                } else {
                    f = f.replace('m', m);
                }
            }
            if(f.search('d') !== -1) {
                if(options.valueLeadingZero && typeof d === 'number' && d.toString().length < 2) {
                    f = f.replace('d', '0' + d);
                } else {
                    f = f.replace('d', d);
                }
            }
            return f;
        }
        // 마스터 이벤트 바인딩
        bindEvent() {
            this.el.addEventListener('click', e => {
                this.openLayer(this.el, e);
            });
            if(options.extraBtn !== null) {
                options.extraBtn.addEventListener('click', e => {
                    eventTrigger(this.el, 'click', e);
                });
            }
            if(options.rangeSelectExtraOutput !== null) {
                options.rangeSelectExtraOutput.addEventListener('click', e => {
                    this.openLayer(options.rangeSelectExtraOutput, e);
                });
                if(options.rangeSelectExtraOutputBtn !== null) {
                    options.rangeSelectExtraOutputBtn.addEventListener('click', e => {
                        eventTrigger(options.rangeSelectExtraOutput, 'click', e);
                    });
                }
            }
        }
        // 해당 연도에 해당하는 월 배열을 리턴함
        getMonthByYear(year) {
            let arr_m = [];
            for(let i = 0; i < 12; i++) {
                let tyf = new Date(options.dateRangeFrom),
                    tyt = new Date(options.dateRangeTo);
                tyf.setFullYear(year);
                tyf.setMonth(i);
                tyt.setFullYear(year);
                tyt.setMonth(i);
                if(tyf >= options.dateRangeFrom && tyt <= options.dateRangeTo) {
                    arr_m.push(i);
                }
            }
            return arr_m;
        }
        // 해당 연도/월 에 가까운 월을 리턴함
        getExistMonth(year, month) {
            let arr_m = this.getMonthByYear(year),
                len = arr_m.length;
            if(arr_m.indexOf(month) > -1) {
                return month;
            } else {
                if(month > arr_m[len - 1]) {
                    return arr_m[len - 1];
                } else if(month < arr_m[0]) {
                    return arr_m[0];
                }
            }
        }
        // 레이어 열기 및 생성
        openLayer(evTarget, ev) {
            let e = typeof ev.detail === 'object' ? ev.detail : ev;
            if(e !== null) {
                e.stopPropagation();
            }
            document.querySelectorAll('.' + options.masterClassName).forEach(elm => {
                elm.style.display = 'none';
            });
            if(!this.layerCreated) {
                this.makeLayer();
                document.querySelector('body').appendChild(this.layer);
            }
            let layerAnchor;
            if(options.rangeSelectExtraOutput !== null && options.rangeSelectExtraOutput === evTarget) {
                layerAnchor = evTarget;
                this.layer.classList.add('dp_rangeSelectExtraOutput');
            } else {
                layerAnchor = this.el;
                this.layer.classList.remove('dp_rangeSelectExtraOutput');
            }
            // 선택일이 없으면
            if(this.selectedDate.length === 0) {
                this.updateCurrentDate(options.defaultDate);
            } else {
                if(options.rangeSelect) {
                    if(options.rangeSelectExtraOutput !== null) {
                        if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                            if(this.selectedDate[1]) {
                                this.updateCurrentDate(this.selectedDate[1]);
                            } else if(this.selectedDate[0]) {
                                this.updateCurrentDate(this.selectedDate[0]);
                            }
                        } else {
                            if(this.selectedDate[0]) {
                                this.updateCurrentDate(this.selectedDate[0]);
                            } else if(this.selectedDate[1]) {
                                this.updateCurrentDate(this.selectedDate[1]);
                            }
                        }
                    } else {
                        this.updateCurrentDate(this.selectedDate[0]);
                    }
                } else {
                    this.updateCurrentDate(this.selectedDate[0]);
                }
            }
            this.layerCreated = true;
            this.updateCalendar();
            const o = layerAnchor.getBoundingClientRect(),
                ot = o.top + parseInt(window.scrollY) + layerAnchor.offsetHeight,
                ol = o.left + parseInt(window.scrollX);
            if(parseInt(this.layer.style.width) + ol > document.body.scrollWidth) { // 넘치면
                this.layer.style.left = 'auto';
                this.layer.style.right = '0px';
            } else {
                this.layer.style.left = ol + 'px';
                this.layer.style.right = 'auto';
            }
            this.layer.style.top = ot + 'px';
            this.layer.style.display = 'block';
            document.addEventListener('click', this.clickOutsideHandler);
        }
        // 레이어 마크업 생성
        makeLayer() {
            this.layer = document.createElement('div');
            this.layer.classList.add(options.masterClassName);
            this.layer.style.width = (options.monthsPerColumn * options.calendarWidth) + 'px';
            this.layer.style.padding = (options.calendarMargin / 2) + 'px';
            this.layer.select_y = document.createElement('div');
            this.layer.select_y.classList.add('select_year');
            let str = '';
            str += '<div class="dp_header" style="margin:0 ' + (options.calendarMargin / 2) + 'px">';
            str += '<button type="button" class="dp_btn prev_y">&lt;</button>';
            str += '<button type="button" class="dp_btn prev_m">&lt;&lt;</button>';
            str += '<button type="button" class="dp_btn next_m">&gt;</button>';
            str += '<button type="button" class="dp_btn next_y">&gt;&gt;</button>';
            str += '</div>';
            this.layer.innerHTML = str;
            this.layer.calendar = [];
            for(let i = 0; i < options.monthsPerCalendar; i++) {
                this.layer.calendar[i] = document.createElement('div');
                let calendarElement = this.layer.calendar[i];
                calendarElement.classList.add('dp_calendar');
                calendarElement.style.width = options.calendarWidth + 'px';
                calendarElement.style.padding = (options.calendarMargin / 2) + 'px ' + (options.calendarMargin / 2) + 'px 0 ' + (options.calendarMargin / 2) + 'px';
                this.layer.appendChild(calendarElement);
                calendarElement.header = document.createElement('div');
                calendarElement.header.classList.add('dp_h');
                calendarElement.header.style.margin = -(options.calendarMargin / 2) + 'px 0 ' + (options.calendarMargin / 2) + 'px 0';
                calendarElement.table = document.createElement('div');
                calendarElement.table.classList.add('dp_t');
                calendarElement.appendChild(calendarElement.header);
                calendarElement.appendChild(calendarElement.table);
                let str_y = '<span class="dp_select header_y"></span>',
                    str_m = '<span class="dp_select header_m"></span>',
                    f = options.calendarFormat;
                if(options.calendarUseSelect && options.monthsPerCalendar < 2) {
                    if(this.dateRangeY.length > 1) {
                        str_y = '<select class="dp_select header_y"></select>';
                    }
                    str_m = '<select class="dp_select header_m"></select>';
                }
                f = f.replace('y', str_y);
                f = f.replace('m', str_m);
                calendarElement.header.innerHTML = f;
                calendarElement.header.header_y = calendarElement.header.querySelector('.dp_select.header_y');
                calendarElement.header.header_m = calendarElement.header.querySelector('.dp_select.header_m');
            }
            this.layer.btn_prev_y = this.layer.querySelector('.dp_btn.prev_y');
            this.layer.btn_next_y = this.layer.querySelector('.dp_btn.next_y');
            this.layer.btn_prev_m = this.layer.querySelector('.dp_btn.prev_m');
            this.layer.btn_next_m = this.layer.querySelector('.dp_btn.next_m');
            this.layer.status = document.createElement('div');
            this.layer.status.classList.add('dp_status');
            this.layer.appendChild(this.layer.status);
            this.updateCalendar();
            this.bindCalendarEvent();
        }
        // 달력의 버튼 업데이트
        updateCalendarBtn() {
            let len_y = this.dateRangeY.length,
                arr_m = this.getMonthByYear(this.y),
                len_m = arr_m.length;
            // 버튼 활성/비활성
            if(this.y >= this.dateRangeY[len_y - 1]) {
                this.layer.btn_next_y.disabled = true;
            } else {
                this.layer.btn_next_y.disabled = false;
            }
            if(this.y <= this.dateRangeY[0]) {
                this.layer.btn_prev_y.disabled = true;
            } else {
                this.layer.btn_prev_y.disabled = false;
            }
            if(this.y === this.dateRangeY[len_y - 1] && this.m >= arr_m[len_m - 1]) {
                this.layer.btn_next_m.disabled = true;
            } else {
                this.layer.btn_next_m.disabled = false;
            }
            if(this.y === this.dateRangeY[0] && this.m <= arr_m[0]) {
                this.layer.btn_prev_m.disabled = true;
            } else {
                this.layer.btn_prev_m.disabled = false;
            }
        }
        // 달력의 헤더 업데이트
        updateCalendarHeader(headerEl, dateObj) {
            let year = dateObj.getFullYear(),
                month = dateObj.getMonth(),
                len_y = this.dateRangeY.length,
                arr_m = this.getMonthByYear(year),
                len_m = arr_m.length,
                str_y = '',
                str_m = '';
            // 셀렉트 년
            if(headerEl.header_y.tagName === 'SELECT' && len_y > 1) {
                for(let i = 0; i < len_y; i++) {
                    let selected = '';
                    if(this.dateRangeY[i] === year) {
                        selected = 'selected';
                    }
                    str_y += '<option value="' + this.dateRangeY[i] + '" ' + selected + '>' + this.dateRangeY[i] + '</option>';
                }
            } else {
                str_y = year;
            }
            // 셀렉트 월
            if(headerEl.header_m.tagName === 'SELECT') {
                for(let j = 0; j < len_m; j++) {
                    let v = arr_m[j],
                        m = options.calendarMonthNames[v];
                    if(options.calendarLeadingZero && typeof m === 'number' && m.toString().length < 2) {
                        m = '0' + m;
                    }
                    str_m += '<option value="' + v + '" ' + (v === month ? 'selected' : '') + '>' + m + '</option>';
                }
            } else {
                let m = options.calendarMonthNames[month];
                if(options.calendarLeadingZero && typeof m === 'number' && m.toString().length < 2) {
                    m = '0' + m;
                }
                str_m = m;
            }
            headerEl.header_y.innerHTML = str_y;
            headerEl.header_m.innerHTML = str_m;
        }
        // 달력 마크업 생성
        drawCalendar(dateObj) {
            const y = dateObj.getFullYear(),
                m = dateObj.getMonth(),
                prevMonthLastDate = new Date(y, m, 0).getDate(), // 해당월의 전달의 마지막날
                lastDate = new Date(y, m + 1, 0).getDate(), // 해당월의 마지막날
                firstDay = new Date(y, m, 1).getDay(), // 해당월의 1일의 요일순서
                lastDay = new Date(y, m, lastDate).getDay(), // 해당월의 마지막날의 요일
                idx_cur_from = firstDay,
                idx_cur_to = lastDate + firstDay,
                len = firstDay + lastDate + (6 - lastDay); // 출력될 날짜 수
            let str = '';
            str += '<table><thead><tr>';
            for(let i = 0; i < 7; i++) {
                str += '<th scope="col">' + options.calendarDayNames[i] + '</th>';
            }
            str += '</tr></thead><tbody>';
            for(let i = 0; i < len; i++) {
                let curDateObj,
                    date,
                    cls = '';
                if(i % 7 === 0) {
                    str += '<tr>';
                }
                // 지난월
                if(i < idx_cur_from) {
                    curDateObj = new Date(y, m - 1, (prevMonthLastDate - (firstDay - i) + 1));
                    cls = options.calendarDayClassNames[curDateObj.getDay()] + ' dp_disabled';
                    if(options.monthsPerCalendar < 2) {
                        date = curDateObj.getDate();
                        cls += ' prev';
                    } else {
                        date = '';
                    }
                }
                // 해당월
                if(i >= idx_cur_from && i < idx_cur_to) {
                    curDateObj = new Date(y, m, (i - idx_cur_from + 1));
                    cls = options.calendarDayClassNames[curDateObj.getDay()];
                    if(curDateObj.getTime() === this.todayDate.getTime()) {
                        cls += ' today';
                    }
                    date = curDateObj.getDate();
                }
                // 다음월
                if(i >= idx_cur_to) {
                    curDateObj = new Date(y, m + 1, i - idx_cur_to + 1);
                    cls = options.calendarDayClassNames[curDateObj.getDay()] + ' dp_disabled';
                    if(options.monthsPerCalendar < 2) {
                        date = curDateObj.getDate();
                        cls += ' next';
                    } else {
                        date = '';
                    }
                }
                // 날짜 제한
                if(curDateObj < options.dateRangeFrom || curDateObj > options.dateRangeTo) {
                    cls += ' dp_restricted';
                } else {
                    // 구간 선택시 날짜 제한
                    if(options.rangeSelect && options.rangeSelectExtraOutput) {
                        if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                            if(this.selectedDate[0] && curDateObj < this.selectedDate[0]) {
                                cls += ' dp_restricted';
                            }
                        } else {
                            if(this.selectedDate[1] && curDateObj > this.selectedDate[1]) {
                                cls += ' dp_restricted';
                            }
                        }
                    }
                    // 선택된 날짜
                    if(curDateObj.getMonth() === m) {
                        if(this.selectedDate[0] && curDateObj.getTime() === this.selectedDate[0].getTime()) {
                            cls += ' dp_selected';
                            if(options.rangeSelect) {
                                cls += ' dp_from';
                            }
                        }
                        if(this.selectedDate[1] && curDateObj.getTime() === this.selectedDate[1].getTime()) {
                            cls += ' dp_selected dp_to';
                        }
                    }
                    if(this.selectedDate[0] && this.selectedDate[1] && curDateObj > this.selectedDate[0] && curDateObj < this.selectedDate[1]) {
                        cls += ' dp_selection';
                    }
                }
                str += '<td class="' + cls + '" data-date="' + curDateObj + '">';
                if(options.calendarLeadingZero && date.toString().length && date.toString().length < 2) {
                    str += '0';
                }
                str += date;
                str += '</td>';
                if(i % 7 === 6) {
                    str += '</tr>';
                }
            }
            str += '</tbody></table>';
            return str;
        }
        // 달력 업데이트
        updateCalendar() {
            let modifier = 0; // 기본적으로 시작일
            if(options.rangeSelect) {
                let tDate,
                    fDate,
                    count = null;
                if(this.selectedDate[0] && this.selectedDate[1]) {
                    tDate = new Date(this.selectedDate[1]);
                    fDate = new Date(this.selectedDate[0]);
                    count = 1;
                    tDate.setDate(1);
                    fDate.setDate(1);
                    while(fDate.getTime() < tDate.getTime()) {
                        let m = tDate.getMonth();
                        tDate.setMonth(m - 1);
                        count++;
                    }
                    ;
                }
                if(options.rangeSelectExtraOutput !== null) {
                    // 분리모드
                    if(count !== null) {
                        // 시작/종료 지정
                        if(options.monthsPerCalendar === count) {
                            if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                                modifier = count - 1;
                            }
                        } else if(options.monthsPerCalendar > count) {
                            if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                                modifier = count - 1;
                            } else {
                                modifier = options.monthsPerCalendar - count;
                            }
                        } else {
                            if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                                modifier = options.monthsPerCalendar - 1;
                            }
                        }
                    } else if(!this.selectedDate[0] && this.selectedDate[1]) {
                        // 종료만 지정
                        if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                            modifier = options.monthsPerCalendar % 2 === 1 ? parseInt(options.monthsPerCalendar / 2) : parseInt(options.monthsPerCalendar / 2) - 1;
                        } else {
                            modifier = options.monthsPerCalendar - 1;
                        }
                    } else if(this.selectedDate[0] && !this.selectedDate[1]) {
                        // 시작만 지정
                        if(!this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                            modifier = options.monthsPerCalendar % 2 === 1 ? parseInt(options.monthsPerCalendar / 2) : parseInt(options.monthsPerCalendar / 2) - 1;
                        }
                    }
                } else {
                    // 통합모드
                    if(count !== null) {
                        // 시작일 및 종료일 모두 지정되어있을때
                        if(options.monthsPerCalendar >= count) {
                            // 달력 표현범위 안
                            modifier = parseInt((options.monthsPerCalendar - count) / 2);
                        }
                    }
                }
            } else {
                // 단일 선택
                modifier = options.monthsPerCalendar % 2 === 1 ? parseInt(options.monthsPerCalendar / 2) : parseInt(options.monthsPerCalendar / 2) - 1;
            }
            this.layer.calendar.forEach((elm, idx) => {
                let d = new Date(this.dateObj);
                d.setMonth(this.m + idx - modifier);
                elm.table.innerHTML = this.drawCalendar(d);
                this.updateCalendarHeader(elm.header, d);
            });
            this.updateCalendarBtn();
        }
        // 달력 관련 이벤트 바인딩
        bindCalendarEvent() {
            // 네비 버튼
            this.layer.btn_prev_y.addEventListener('click', e => {
                this.moveCalendar('prev_y');
                e.stopPropagation();
            });
            this.layer.btn_prev_m.addEventListener('click', e => {
                this.moveCalendar('prev_m');
                e.stopPropagation();
            });
            this.layer.btn_next_y.addEventListener('click', e => {
                this.moveCalendar('next_y');
                e.stopPropagation();
            });
            this.layer.btn_next_m.addEventListener('click', e => {
                this.moveCalendar('next_m');
                e.stopPropagation();
            });
            // 셀렉트 박스 change
            if(options.calendarUseSelect) {
                this.layer.calendar.forEach((elm, idx) => {
                    elm.header.header_y.addEventListener('change', e => {
                        let cy = e.target.options[e.target.selectedIndex].value;
                        this.dateObj.setFullYear(cy);
                        this.dateObj.setMonth(this.getExistMonth(cy, this.dateObj.getMonth()));
                        this.updateCurrentDate(this.dateObj);
                        this.updateCalendar();
                    });
                    elm.header.header_m.addEventListener('change', e => {
                        this.dateObj.setMonth(e.target.options[e.target.selectedIndex].value);
                        this.updateCurrentDate(this.dateObj);
                        this.updateCalendar();
                    });
                });
            }
            this.layer.calendar.forEach(elm => {
                // 날짜 클릭시
                elm.table.addEventListener('click', e => {
                    e.stopPropagation();
                    let et = e.target.closest('td');
                    if(et !== null) {
                        if(!et.classList.contains('dp_restricted')) {
                            if(et.classList.contains('dp_disabled')) {
                                if(et.classList.contains('prev')) {
                                    this.moveCalendar('prev_m');
                                } else if(et.classList.contains('next')) {
                                    this.moveCalendar('next_m');
                                }
                            } else {
                                let data = e.target.closest('td').dataset;
                                this.applyDate(new Date(data.date), et);
                            }
                        }
                    }
                });
                // 마우스 오버
                elm.table.addEventListener('mouseover', e => {
                    let et = e.target.closest('td');
                    if(et !== null && !et.classList.contains('dp_restricted') && !et.classList.contains('dp_disabled')) {
                        if(options.rangeSelect) {
                            // 범위선택
                            if(options.rangeSelectExtraOutput === null) {
                                // 통합모드
                                if(this.selectedDate.length === 1) {
                                    // 첫클릭후
                                    let d,
                                        d_cur,
                                        startDate = this.selectedDate[0],
                                        endDate = new Date(et.dataset.date);
                                    this.layer.querySelectorAll('td').forEach(ele => {
                                        d = new Date(ele.dataset.date);
                                        if(d > startDate && d < endDate) {
                                            ele.classList.add('dp_selection_hover');
                                        } else {
                                            ele.classList.remove('dp_selection_hover');
                                        }
                                    });
                                    if(!et.classList.contains('dp_restricted') && !et.classList.contains('dp_disabled')) {
                                        et.classList.add('dp_hover');
                                        d_cur = new Date(et.dataset.date);
                                        if(d_cur >= startDate) {
                                            this.layer.status.innerText = '종료일 선택';
                                        } else {
                                            this.layer.status.innerText = '시작일 다시 선택';
                                        }
                                    }
                                } else {
                                    // 첫클릭 전
                                    if(!et.classList.contains('dp_restricted') && !et.classList.contains('dp_disabled')) {
                                        et.classList.add('dp_hover');
                                        if(this.selectedDate.length === 2) {
                                            this.layer.status.innerText = '처음부터 다시 선택';
                                        } else {
                                            this.layer.status.innerText = '시작일 선택';
                                        }
                                    }
                                }
                            } else {
                                // 분리모드
                                if(!et.classList.contains('dp_restricted') && !et.classList.contains('dp_disabled')) {
                                    et.classList.add('dp_hover');
                                }
                                let d,
                                    d_cur,
                                    startDate,
                                    endDate;
                                if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                                    // 종료일
                                    startDate = this.selectedDate[0] ? this.selectedDate[0] : null, endDate = new Date(et.dataset.date);
                                    if(this.selectedDate[1]) {
                                        this.layer.status.innerText = '종료일 다시 선택';
                                    } else {
                                        this.layer.status.innerText = '종료일 선택';
                                    }
                                } else {
                                    // 시작일
                                    startDate = new Date(et.dataset.date), endDate = this.selectedDate[1] ? this.selectedDate[1] : null;
                                    if(this.selectedDate[0]) {
                                        this.layer.status.innerText = '시작일 다시 선택';
                                    } else {
                                        this.layer.status.innerText = '시작일 선택';
                                    }
                                }
                                if(startDate !== null && endDate !== null) {
                                    this.layer.querySelectorAll('td').forEach(ele => {
                                        d = new Date(ele.dataset.date);
                                        if(d > startDate && d < endDate) {
                                            ele.classList.add('dp_selection_hover');
                                        } else {
                                            ele.classList.remove('dp_selection_hover');
                                        }
                                    });
                                }
                            }
                        } else {
                            // 단일 선택
                            et.classList.add('dp_hover');
                            if(this.selectedDate.length === 1) {
                                this.layer.status.innerText = '날짜 다시 선택';
                            } else {
                                this.layer.status.innerText = '날짜 선택';
                            }
                        }
                    } else {
                        this.layer.status.innerText = '';
                    }
                });
                let mouseOutTimer;
                elm.table.addEventListener('mouseout', e => {
                    let et = e.target.closest('td');
                    if(et !== null) {
                        et.classList.remove('dp_hover');
                    }
                    this.layer.status.innerText = '';
                });
            });
            this.layer.addEventListener('mouseout', e => {
                this.layer.querySelectorAll('.dp_selection_hover').forEach(ele => {
                    ele.classList.remove('dp_selection_hover');
                });
            });
        }
        // 날짜 저장, 지정, 리셋 메서드
        applyDate(dateObj, tdElement) {
            if(options.rangeSelect) {
                // 범위선택
                if(options.rangeSelectExtraOutput === null) {
                    // 통합모드
                    switch(this.selectedDate.length) {
                        case 0:
                            // 첫번째 선택
                            tdElement.classList.add('dp_selected', 'dp_from');
                            this.selectedDate[0] = new Date(dateObj);
                            this.el.value = this.formatValue(this.selectedDate[0]) + options.valueRangeSeperator;
                            break;
                        case 1:
                            // 두번째 선택
                            let d = new Date(dateObj);
                            if(d < this.selectedDate[0]) {
                                // 첫번째 선택보다 이전 날짜 선택시
                                if(this.layer.querySelector('td.dp_selected')) {
                                    this.layer.querySelector('td.dp_selected').classList.remove('dp_selected', 'dp_from');
                                }
                                tdElement.classList.add('dp_selected', 'dp_from');
                                this.selectedDate[0] = new Date(d);
                                this.el.value = this.formatValue(this.selectedDate[0]) + options.valueRangeSeperator;
                            } else {
                                // 첫번째 선택보다 이후 또는 같은 날짜 선택시
                                tdElement.classList.add('dp_selected', 'dp_to');
                                this.selectedDate[1] = new Date(d);
                                this.closeLayer();
                                this.el.value = this.formatValue(this.selectedDate[0]) + options.valueRangeSeperator + this.formatValue(this.selectedDate[1]);
                                // 범위선택 & 날짜 선택시 콜백
                                if(typeof options.onSelect === 'function') {
                                    options.onSelect(this.el, this.selectedDate[0], this.selectedDate[1]);
                                }
                            }
                            break;
                        case 2:
                            // 첫번쨰 및 두번째 선택 재설정후 첫번째 선택
                            this.layer.querySelectorAll('.dp_selection').forEach(elm => {
                                elm.classList.remove('dp_selection');
                            });
                            this.layer.querySelectorAll('.dp_selected').forEach(elm => {
                                elm.classList.remove('dp_selected', 'dp_from', 'dp_to');
                            });
                            this.selectedDate = [];
                            tdElement.classList.add('dp_selected', 'dp_from');
                            this.selectedDate[0] = new Date(dateObj);
                            this.el.value = this.formatValue(this.selectedDate[0]) + options.valueRangeSeperator;
                            break;
                    }
                } else {
                    // 분리모드
                    if(this.layer.classList.contains('dp_rangeSelectExtraOutput')) {
                        // 종료일
                        this.selectedDate[1] = new Date(dateObj);
                        options.rangeSelectExtraOutput.value = this.formatValue(this.selectedDate[1]);
                    } else {
                        // 시작일
                        this.selectedDate[0] = new Date(dateObj);
                        this.el.value = this.formatValue(this.selectedDate[0]);
                    }
                    this.closeLayer();
                    if(this.selectedDate[0] && !this.selectedDate[1]) {
                        eventTrigger(options.rangeSelectExtraOutput, 'click');
                    } else if(!this.selectedDate[0] && this.selectedDate[1]) {
                        eventTrigger(this.el, 'click');
                    }
                }
            } else {
                // 단일 선택 모드
                this.selectedDate[0] = new Date(dateObj);
                this.closeLayer();
                this.el.value = this.formatValue(this.selectedDate[0]);
                // 날짜 선택시 콜백
                if(typeof options.onSelect === 'function') {
                    options.onSelect(this.el, this.selectedDate[0]);
                }
            }
        }
        // 년/월 이동
        moveCalendar(direction) {
            switch(direction) {
                case 'prev_m':
                    this.dateObj.setMonth(this.m - 1);
                    break;
                case 'next_m':
                    this.dateObj.setMonth(this.m + 1);
                    break;
                case 'prev_y':
                    this.dateObj.setFullYear(this.y - 1);
                    this.dateObj.setMonth(this.getExistMonth(this.y - 1, this.dateObj.getMonth()));
                    break;
                case 'next_y':
                    this.dateObj.setFullYear(this.y + 1);
                    this.dateObj.setMonth(this.getExistMonth(this.y + 1, this.dateObj.getMonth()));
                    break;
            }
            this.updateCurrentDate(this.dateObj);
            this.updateCalendar();
        }
        // 레이어 닫기
        closeLayer() {
            this.layer.style.display = 'none';
            document.removeEventListener('click', this.clickOutsideHandler);
        }
    }
    // 날짜 문자열 체크
    const checkDateObj = (date, err, elm) => {
        if(isNaN(Date.parse(date))) { // RFC2822 또는 ISO 8601 에 정의된 날짜 문자열이 아닌경우
            console.error(err, elm);
            return false;
        } else {
            return date;
        }
    };
    // 날짜 제한 문자열 체크
    const parseDateRange = (date, str, isPositive) => {
        let t = new Date(date),
            k,
            s = isPositive ? '' : '-';
        if(str.indexOf('y') > -1) {
            k = Number(s + str.split('y')[0]);
            t.setFullYear(t.getFullYear() + k);
        } else if(str.indexOf('m') > -1) {
            k = Number(s + str.split('m')[0]);
            t.setMonth(t.getMonth() + k);
        } else if(str.indexOf('w') > -1) {
            k = Number(s + str.split('w')[0]) * 7;
            t.setDate(t.getDate() + k);
        } else if(str.indexOf('d') > -1) {
            k = Number(s + str.split('d')[0]);
            t.setDate(t.getDate() + k);
        }
        return t;
    };

    /* 공통으로 사용할 부분 끝 */
    Array.from(targetNodes).forEach(exec);

    function exec(el, idx, arr) {
        /*
         플러그인 내용 시작
         사용할수 있는 인자
         el : 플러그인 적용할 엘리먼트 (현재)
         arr : 플러그인 적용할 엘리먼트 (전체)
         idx : 현재/전체 인덱스
         options : 사전정의 + 호출시 정의한 옵션 항목들
         dataContainer : 호출시 정의한 데이터셋
         */

        // 기본 표시 날짜를 options.defaultDate 에 Date object 형태로 정의
        options.defaultDate = (() => {
            let t,
                err;
            if(options.defaultDate === null) { // 직접입력값 없으면
                if(typeof el.dataset.defaultDate === 'undefined') { // element 의 속성에 정의되었나?
                    t = new Date(); // 오늘 날짜로 설정
                } else {
                    t = new Date(el.dataset.defaultDate);
                    err = 'ERROR : [attribute data-default-date] : ' + el.dataset.defaultDate;
                }
            } else { // 직접입력값 있으면 사용
                t = new Date(options.defaultDate);
                err = 'ERROR : [options.defaultDate] : ' + options.defaultDate;
            }
            t.setHours(0, 0, 0, 0);
            return checkDateObj(t, err, el);
        })();
        // 날짜제한
        if(options.dateRangeFrom === null) {
            options.dateRangeFrom = checkDateObj(parseDateRange(options.defaultDate, options.dateRange, false), 'ERROR : [options.dateRange] : ' + options.dateRange, el);
        } else {
            options.dateRangeFrom = checkDateObj(new Date(options.dateRangeFrom), 'ERROR : [options.dateRangeFrom] : ' + options.dateRangeFrom, el);
        }
        options.dateRangeFrom.setHours(0, 0, 0, 0);
        if(options.dateRangeTo === null) {
            options.dateRangeTo = checkDateObj(parseDateRange(options.defaultDate, options.dateRange, true), 'ERROR : [options.dateRange] : ' + options.dateRange, el);
        } else {
            options.dateRangeTo = checkDateObj(new Date(options.dateRangeTo), 'ERROR : [options.dateRangeTo] : ' + options.dateRangeTo, el);
        }
        options.dateRangeTo.setHours(0, 0, 0, 0);
        options.calendarFormat = options.calendarFormat.toLowerCase().replace(/(.)\1+/g, '$1');
        el.autocomplete = 'off';
        if(options.extraBtn !== null && options.extraBtn.nodeType !== 1) {
            console.error('ERROR : [options.extraBtn] : ' + options.extraBtn);
        }
        if(options.rangeSelectExtraOutput !== null && options.rangeSelectExtraOutput.nodeType !== 1) {
            console.error('ERROR : [options.rangeSelectExtraOutput] : ' + options.rangeSelectExtraOutput);
        }
        // 인스턴스 생성 및 실행
        const calendar = new Calendar(options.defaultDate, el);
        calendar.bindEvent();
        instances.push(calendar);

        /* 플러그인 내용 끝 */
    }
};
export default Datepicker;
