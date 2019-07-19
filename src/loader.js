'use strict';


class DynamicLoader {
    constructor() {
        this.modules = {};

    }
    Datepicker(opt) {
        if(this.aaainitState) {
            new this.aaa.default(opt);
        } else {
            this.initDatepicker().then(([resolved]) => {
                this.aaa = resolved;
                new this.aaa.default(opt);
                this.aaainitState = true;
            })
        }
    }
    Accordion(opt) {
        if(this.bbbinitState) {
            new this.bbb.default(opt);
        } else {
            this.initAccordion().then(([resolved]) => {
                this.bbb = resolved;
                new this.bbb.default(opt);
                this.bbbinitState = true;
            })
        }
    }

    initAccordion() {
        return Promise.all([
            import(/* webpackChunkName: "Accordion" */'@saramin/ui-accordion')
        ]);

    }

    initDatepicker() {
        return Promise.all([
            import(/* webpackChunkName: "Datepicker" */'@saramin/ui-datepicker')
        ]);
    }




}

export default DynamicLoader;
